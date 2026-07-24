-- Disposable-test bootstrap only. Production role creation is a separately
-- ticketed operator action and must not reuse this fixture.
--
-- This file intentionally contains no LOGIN role and no credential. The
-- harness creates uniquely named, short-lived LOGIN roles over stdin after
-- these two fixed capability roles exist.

create role sirinx_agent_runtime_owner
    nologin
    noinherit
    nosuperuser
    nocreatedb
    nocreaterole
    noreplication
    nobypassrls;

create role sirinx_agent_runtime_app
    nologin
    inherit
    nosuperuser
    nocreatedb
    nocreaterole
    noreplication
    nobypassrls;
