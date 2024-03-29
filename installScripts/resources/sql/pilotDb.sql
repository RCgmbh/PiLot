/*--------- DB AND USER -----------------------------------*/

CREATE DATABASE pilot
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

\c pilot
CREATE EXTENSION postgis;
CREATE USER pilotweb WITH PASSWORD 'sailor';