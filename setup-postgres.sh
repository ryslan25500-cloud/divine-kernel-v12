#!/bin/bash
sudo -u postgres psql << SQL
CREATE DATABASE divine_kernel;
CREATE USER divine_user WITH PASSWORD 'divine_password';
GRANT ALL PRIVILEGES ON DATABASE divine_kernel TO divine_user;
ALTER DATABASE divine_kernel OWNER TO divine_user;
SQL
