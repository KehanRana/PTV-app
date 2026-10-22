import os
from pathlib import Path
import re
import shutil
import subprocess
from urllib.parse import unquote, urlsplit


def fail(message):
    raise SystemExit(message)


env_file = Path(__file__).resolve().parents[1] / '.env'
match = re.search(r'^\s*(?:export\s+)?DATABASE_URL\s*=\s*(.*)$', env_file.read_text(), re.M)
if not match:
    fail('DATABASE_URL is missing from .env.')
url = urlsplit(match.group(1).strip().strip('\"\''))
if url.scheme not in ('postgres', 'postgresql') or url.hostname not in ('localhost', '127.0.0.1', '::1'):
    fail('This setup script only supports local PostgreSQL URLs.')
user, password, database = unquote(url.username or ''), unquote(url.password or ''), unquote(url.path.lstrip('/'))
if not all((user, password, database)):
    fail('DATABASE_URL must specify username, password and database.')
psql = shutil.which('psql')
if not psql:
    fail('Install PostgreSQL and add psql to PATH first.')
base_env = {k: v for k, v in os.environ.items() if not k.startswith('PG')}
base_env['PGCONNECT_TIMEOUT'] = '5'


def run(sql, app=False):
    env = base_env.copy()
    env.update(PGPORT=str(url.port or 5432))
    if app:
        env.update(PGHOST=url.hostname, PGUSER=user, PGPASSWORD=password, PGDATABASE=database)
    else:
        env.update(PGHOST='/tmp', PGDATABASE='postgres')
    result = subprocess.run([psql, '-X', '-w', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1'],
                            input=sql, text=True, capture_output=True, env=env)
    if result.returncode:
        # SQL failures may echo credentials; deliberately keep diagnostics private.
        fail('Database operation failed. Check the local service, administrator access, and .env credentials. No credentials were printed.')
    return result.stdout.strip()


def literal(value):
    return "'" + value.replace("'", "''") + "'"


def identifier(value):
    return '"' + value.replace('"', '""') + '"'


role_exists = run('SELECT 1 FROM pg_roles WHERE rolname = ' + literal(user)) == '1'
db_exists = run('SELECT 1 FROM pg_database WHERE datname = ' + literal(database)) == '1'
if not role_exists:
    run('SET standard_conforming_strings = on; CREATE ROLE ' + identifier(user)
        + ' LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD ' + literal(password))
    print('Created app login with restricted privileges.')
else:
    print('App login already exists; its password and privileges were preserved.')
if not db_exists:
    run('CREATE DATABASE ' + identifier(database) + ' OWNER ' + identifier(user))
    print('Created app database.')
else:
    print('App database already exists; existing data was preserved.')
run('SELECT 1;', app=True)
run('BEGIN; CREATE TABLE public._ontrack_setup_check (id integer); ROLLBACK;', app=True)
version = run("SELECT current_setting('server_version');", app=True)
print('Verified app login and database write access. PostgreSQL version: ' + version)
