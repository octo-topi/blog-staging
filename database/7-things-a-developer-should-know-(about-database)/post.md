# 7 things a developer should know about database

## Observe your database

When bad things happen in production, it's too late to realize you don't know what is happening.

Executed queries: `log_min_statement_duration`
Running queries: `pg_stat_activity`
Executed queries: `pg_stat_statements`

## Ride safe in production

Make it hard to do something wrong.

Do NOT connect in write mode.
```postgresql
SET default_transaction_read_only = ON;
```

Even though, abort your query automatically pass a time.
```postgresql
SET statement_timeout = 60000;
```

## Connect only through remote database client for usual tasks

Do NOT connect to the database server using a remote shell if using VM, neither connect to container if you use docker. Always use a plain SQL client, like psql, **remotely**. 

Connecting locally can lead to nasty situations ( killing a process to stop a query stops the database, [etc.](https://www.cybertec-postgresql.com/en/docker-sudden-death-for-postgresql/)). Nobody can know how much side effects, and to be on the safe side, do not mess client with server concerns. 

We may be tempted to do so to launch some batch operations, because you don't have a scheduler.   

## If you lose contact, the database will not look after you

Remember this query you launched from your laptop in a bar, but then the hotspot went out ? Or that query your colleague started before lunch, but had to leave for personal and urgent matters ? In such situations, you need to know if the query is still running, and maybe to stop it. 

You may reply that nobody should ever launch queries from their desktop, cause our private laptop and network are notoriously unreliable. Well, even remote one-off container times out. And an upstream proxy times out, as in [HTTP 504 error code](504 Gateway Timeout)

So you should plan for failure as [in 12-factor app](https://12factor.net/disposability).

PostgreSQL will generally not be notified of client disconnection, unless your database client get notified of your attempt to stop the query (eg. sending SIGINT signal with Ctrl-C in `psql`).



[HapiJs](https://github.com/hapijs/hapi/issues/3528)
[NodePG](https://github.com/brianc/node-postgres/issues/773)



## Know how to terminate

Someone/thing will connect to production and run a query you don't want him/it to run.

It may be because the :
- query is wrong, and corrupts data;
- the query is greedy on resources, and slow down everyone;
- the query is long, and you badly need your ZDD migration to run.


## Know your locks 

[Lock tree](https://wiki.postgresql.org/wiki/Lock_dependency_information#Recursive_View_of_Blocking)


## Manage connexions
Pools and concurrency.
Application scaling.

