# 7 things a developer should know about databases

I dedicate this post to Michel Vayssade. 15 years ago, your courses mixed high abstraction with down-to-earth concretion, in your demanding and unadorned style. What a joy to reap again the benefit of them in understanding databases !

## TL;DR

Full-stack and back-end developers, you probably don't know this - and it can get out of trouble:

- `pg_stat_activity` view shows executing queries, `pg_stat_statements` shows executed queries;
- use a pool; make sure when scaling you do not reach max_connections;
- activate `default_transaction_read_only` and `statement_timeout` in your sql client in production;
- never login to production database OS/container: use a sql client instead;
- if `pg_stat_activity` shows queries waiting for lock, use the lock view to find which ones got them;
- when a SQL query has started, it will run until completion - doesn't matter if the client is gone;
- use `pg_terminate_backend` to stop a query, and be ready for AUTOVACUUM.

## Why should I care ?

99% of the time, developer doesn't have to care about database. As long as they practice the basics they learned in initial training (a sound - and versioned - data model, consistency with transaction, and some index for performance), they don't have to think much about it. The database is a nice black box. As for me, a web developer, I enjoy learning database internals for fun: it gives me the kind of thrill I only got in systems programming courses.

Over the years, I've come to realize that some bits of what I learned from internals were useful for anyone. Actually, these bits may come and bite you harshly in production. So, instead of laughing under my breath when these things happen to others, I'm going to share them now.

My first idea was to produce "an emergency kit", but thanks to Tom Kyte (from the introduction of his book "Effective Oracle by Design") I've included preventive knowledge, especially concurrency. As we have to know so many things, I've kept the list short. For the same reasons, I only cover PostgreSQL, being the most used relational database these days by our clients.

## Preventive healthcare

### Know your database

> First things first: before going live, make your database observable.

When bad things will happen in production (and they will), it will too late to realize you don't know what is actually happening. From the project's onset, in the [walking skeleton](https://wiki.c2.com/?WalkingSkeleton) - the first time code is deployed on a remote environment, you should know which queries are under execution in the database.

A native PG view does exactly that : [pg_stat_activity](https://www.postgresql.org/docs/current/monitoring-stats.html#MONITORING-PG-STAT-ACTIVITY-VIEW). It mentions which user is executing which query on which database, and the status of this query: it is waiting for the disk, is it waiting for a lock ? Increase [track_activity_query_size](https://www.postgresql.org/docs/current/runtime-config-statistics.html#GUC-TRACK-ACTIVITY-QUERY-SIZE) to get the full query text, and set [application_name](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-APPLICATION-NAME) when connecting.

Once you've got this set and easily accessible (some PaaS offer a web view), you need to know what happened at a specific time, eg. when the response time increased last friday night. Again, a built-in feature exists, which logs queries completion in database logs. You can enable it for queries which exceed some duration, say 10 seconds using [log_min_duration_statements](https://www.postgresql.org/docs/current/runtime-config-logging.html#GUC-LOG-MIN-DURATION-STATEMENT) parameter. I advise to try logging all queries: if your logs get too big, you can always reduce the retention size. Most platforms come with built-in monitoring tools to get CPU, RAM and I/O (disk and network). If you send these metrics and your query logs into a dataviz tool, you'll ready in case something happen in production.  

If you still need more, like optimizing your queries, you'll need a statistics tool. While optimization should be done at the application level, using an [APM](https://en.wikipedia.org/wiki/Application_performance_management), you can get statistics quickly in the database using [pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html). It's not active by default, as it add some overhead, but it's worth throwing a glance.

**TL;DR: pg_stat_activity view shows executing queries, pg_stat_statements shows executed queries**

### Concurrency is a concretion

Concurrency is not an abstraction. You may think concurrency is a concern for programming langage designers or architects, something you shouldn't worry about, something that has been taken care of at the beginning of the project. Especially in database. Well, if you want to ride full throttle, beware of concurrency.

Let's consider the worst case: we deploy a REST API back-end on a PaaS which offers horizontal auto-scaling, plus DBaS. If we want to max out the database performance, we should consider 2 levels : inside the database, and outside the database. You want a small pool, saturated with threads waiting for connections.

Inside the database : configure the [maximum number of connections](https://www.postgresql.org/docs/current/runtime-config-connection.html#GUC-MAX-CONNECTIONS) properly, according first to the count of CPU core and then I/O technology (SSD/HDD). A rule of thumb is, for SSD, connections = `2 * cpu_core_count`. If you configure a higher figure, the global response may **increase**. To understand why, read carefully [this post](https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing#but-why). If you use a DBaaS, this will be done for you, but you must understand why they choose such value.

Outside the database : the database dictate the maximum number of connections, which means any connection request from your backend will bounce back if this number is reached. To avoid this, and for others motives I will not delve into here, you must use a connection pool. There are many options, but usually for REST backend, the pool is into your backend container, as a library. So to make proper use of all connections the database can handle while scaling your containers, make sure each backend connection pool opens **at most** `max_connections / backend_container_count`. I didn't mention how many connections it should use at least : to answer that, you have to do performance tests.

**TL;DR: use a pool; make sure when scaling you do not reach max_connections**

### Ride safe

Connecting to production to monitor queries using any general-purpose client, say `psql`, is risky. If your database user can query tables, and you paste some long query in (what you thought was) the development environment, you can slow down the whole database. Of course, you can even corrupt data if you have write privileges. Your boss may reply "but you should take care of what you're doing". I disagree.

> Make it hard to do something wrong.

If you can't get a read-only account, make your session read-only.

```postgresql
SET default_transaction_read_only = ON;
```

And please do so programmatically, using a pre-connection hook like [.psqlrc](https://www.postgresql.org/docs/current/app-psql.html#APP-PSQL-FILES-PSQLRC) file.

When you session is read-only, prevent long-running queries by setting a timeout (here, one minute).

```postgresql
SET statement_timeout = 60000;
```

Sometimes, you actually need write privileges for troubleshooting. Your plan is to start a transaction, do some INSERT/UPDATE/DELETE, and then rollback the transaction; as if nothing actually happens. Well, nothing has happened as far as other transaction are concerned. But something did actually happen in data files: all the changes made by your transaction are now dead tuples. I would be delighted to tell you about this dead stuff, as it's a great way to learn MVCC, but I'm running short of time. You know should these tuples take disk space. This disk space will be reused for other tuples (on this table) after a [VACUUM](https://www.postgresql.org/docs/current/sql-vacuum.html) completes. This is done automatically, but take resources (CPU and I/O), so if you updated much data, database response time may increase when the AUTO-VACUUM does its job.

**TL;DR: activate default_transaction_read_only and statement_timeout in your sql client in production**

### Don't mix clients and server

Do NOT connect to the database server using a remote shell (if using VM), neither connect to container (if you use docker). Always use a plain SQL client, like `psql`, **remotely**.

Doing things locally on the server can lead to nasty situations :

- to stop a query, you kill the corresponding OS process ... and the database goes into recovery mode;
- some healthcheck query runs into the server, [causing it to](https://www.cybertec-postgresql.com/en/docker-sudden-death-for-postgresql/) crash (!).

As a developer, you're not expected each and every side effects. To be on the safe side, do not mix client with server concerns.

You need to import a huge CSV data file or launch long-running queries, "just once" ? You may be tempted to do it from the database server, to prevent timeout or security concerns. Sure. But I strongly suggest to use a separate client, like some one-off container if using a DBaaS, or a dedicated scheduler.

**TL;DR: never login to production database OS/container: use a sql client instead**

## In the emergency room

You've followed all previous rules and, well, bad things are actually happening. What can you do ? You can exercise before bad things happens, so you can keep a cold head when things turns hot, telephone keep ringing and your manager keep sneaking over your shoulder. So, read the following and practice with a colleague who play the devil's role, pushing bugs and running rogue queries into (a maybe fake) production.

### Locks are NOT evil

 Some API calls are way too long, and you found using `pg_stat_activity` that the underlying SQL query is under execution, waiting for a lock. You mumble against locks, but think twice. Locks are good : without them, no concurrency can ever happen. PostgreSQL locks are fine-grained (on row, partition, table) and many tricks are performed so, except for DDL, "reader doesn't lock writers, and writer doesn't block readers".

What's bad is resource starving : if your query is waiting for a lock to be granted, it's because another query has not released it. Locks are managed in FIFO queue: there is no shortcut to have lock granted sooner. What you need is to find the blocking query, and check why it hasn't released the lock yet.

If your transaction spans several queries (if you create a transaction explicitly with `BEGIN TRANSACTION` keyword to do so), two more rules applies:

- locks are requested as late as possible, not at the beginning of the transaction;
- locks are released at the end of the transaction.

That means a transaction can stop after one query, waiting for a lock grant, thereby blocking another query. Transitively, a transaction can block many other ones.  

Well, to find who's not releasing the lock, [pg_locks] native view is the way to go. As it's not human friendly, and list a lock per row, use [this version](https://wiki.postgresql.org/wiki/Lock_dependency_information#Recursive_View_of_Blocking) which displays the lock tree.

Here, session 3 is blocked by session 2, itself blocked by session 1. The root blocking session, session 1,  stays on the first line, and each indent shows the session it blocks, session 2. The lock held by session 1 is on `foo` table has not been released, because the session 1 is waiting for lock on `bar` table to be granted. Now it's your job to know this lock has not been granted.

**TL;DR: if pg_stat_activity shows queries waiting for lock, use the lock view to find which ones got them**

### Keep contact, cause the database won't

What happened to the query you launched from your laptop, just before you spill your coffee ? To the query your colleague kicked before lunch on his machine (coz' it's sooo long, and fewer people are using the database at noon), but had to unplug hastily from the network to come back home ?

These queries are similar to orphaned process : their parent process are not alive anymore. The query is
was running in the server (the database) but the client is gone. What will happen then ?

Your boss may reply that nobody should ever launch queries from their desktop, cause our private laptop and network are notoriously unreliable. Adding to that, queries should be quick, not long-running. Well, you've got a point here. But even remote one-off container times out. Timeout are not evil, they're a way to ensure you don't wait forever, with a call stack growing forever. You should plan for failure as [in 12-factor app](https://12factor.net/disposability).

Many proxies have a timeout, like the proxies ahead of REST API, that's what [HTTP 504 error code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504) is for. So, what happens to a REST API call that timeout, while PG is executing a query ? Frameworks differs : by default, Node's HapiJs go on processing the SQl query, and when it returns the response to the front-end, it finds a closed socket.  Therefore, if bad things happen in production, it may be because your front-end is making consecutive API calls, each one triggering a SQL query which times out. The same SQL query is executing again and again, using database resources for nothing. You can find such occurrences if you monitor your API queries and running SQL queries. Maybe you can [add custom code](https://github.com/hapijs/hapi/issues/3528) to ask PG to cancel the query on client disconnection, but for now you need to stop those queries.

If we came back to the queries we talked about at the very beginning (coffee and lunch), what happens when the sql client is gone ? By default, PostgreSQL will generally NOT know about client disconnection. He is notified only if your client notify him gracefully before leaving, eg. if you hit Ctrl-C in `psql`. So these queries will go on. If you need to stop them, let's see how to do this properly in the next (and last !) chapter.

**TL;DR: when a SQL query has started, it will run until completion - doesn't matter if the client is gone**

### Know how to terminate

Someone/thing has connected to production and started a query, but you don't want this query to run anymore.

It may be because :

- the client is gone and the query alone is useless;
- the query is wrong, and corrupts data (a bug);
- the query is greedy on resources, and slow down everyone (a bug ?);
- the query is long, and you badly need your ZDD database migration to run.

The only proper way to do this is using a SQL client and call one of these methods:

- `pg_cancel_backend($PID)`;
- `pg_terminate_backend($PID, $TIMEOUT)`.

These methods, internally, send SIGINT and SIGTERM signals to linux $PID processes. Do not jump to conclusion you can do this by yourself using `kill` command, that would cause a database recovery, which require service interruption.

Keep in mind that the transaction in which these queries run will be rollbacked, which means some AUTO-VACUUM can happen afterwards (you remember [Lock are not evil](#locks-are-not-evil), don't you ?).

**TL;DR: use pg_terminate_backend to stop a query, and be ready for AUTOVACUUM**
