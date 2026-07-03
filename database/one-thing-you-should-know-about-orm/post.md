# One thing you should know about ORM


> 2 difficult things : name and invalidating cache 

2 kind of cache
- Write-through cache
- 

Add ORM book

L1 and L2

Transaction


Track down a performance problem


Document database :
- load document
- table of contents in JSON
- stored as JSONB in PostgreSQL

Steps :

- define what "quick" enough would be

- reproduce the problem
  - knead the dataset :
    - document
      - one or many
      - change document size
    - categories
      - one or many
      - change document size
  - same platform :
    - check same in production, and pre-production
    - compare performance tests (smaller dataset)
    - use a local database, pin down memory and CPU using Docker
    - use a local web server, pin down memory usage in Java using maven


- find where most of the time is spent
  - on front-end / use network tool  
  - on remote API call / log, disable caching 
  - on database / use pg_stats_statements + change resources
  - in web server / use AOP and tune logback + change resources

- JSON compressed in DB storage ?
- JSON compressed in memory storage ?

## ORM

- layout:
  - Spring MVC
  - Hibernate ORM
  - JDBC layer
  - database

### Transaction
2PL or MVCC

MVCC:
- readers does not block writer
- writer does not block readers
- writers block writers

prevent write-write => physical lock

optimistic VS pessimistic (lost update caused by dirty write)
- pessimistic: require a explicit lock
- optimistic: check on update if the version is the same, otherwise raise an exception (performed by application, not by database) 

### Persistence context

its lifetime is bound to the transaction.

Persistence Context : on flush time, captures entity state changes (dirty checking) => SQL statement 

Entity states 
- New
- Managed :
  - an insert statement will be issued at flush time 
  - state changes are detected by dirty checking and propagated as update statement at flush time
- Detached

2 goals:
- increase database concurrency (by reducing lock acquisition interval, by shorting transaction time)
- reduce network latency (an update should not wait for the insert to suceeed)

Problems:
- native or JPQL queries cannot access a persistence context, so if a flush is not triggered manually, it may lead to inconsistencies (read your own write)  

### Flush

FlushMode.AUTO is the default Hibernate API flushing mechanism: it flushes the Persistence Context on every transaction commit, not necessarily the current running transaction

 > When executing an HQL query, Hibernate inspects what tables the current query is about to scan, and it triggers a flush only if there is a pending entity state transition matching the query table space.

Order: not chronological, but by type:
- EntityInsertAction
- EntityUpdateAction

Dirty checking
> Even if only one entity attribute changed, Hibernate would still have to go through all managed entities in the current Persistence Context. If the number of managed entities is fairly large, the default dirty checking mechanism might have a significant impact on CPU resources.

> Since the entity loading time snapshot is held separately, the Persistence Context requires twice as much memory to store a managed entity.
> When entities are loaded in read-only mode, there is no loading time snapshot being taken and the dirty checking mechanism is disabled for these entities.

Enhance dirty checking by tracking change in entity rather than reflection
> Although bytecode enhancement dirty tracking can speed up the Persistence Context flushing mechanism, if the size of the Persistence Context is rather small, the improvement will not be that significant.


Cache:
- first level : persistence context, write-behind transactional cache
- second level :  


https://github.com/GradedJestRisk/java-training/wiki/Hibernate