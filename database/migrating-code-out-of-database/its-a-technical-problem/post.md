# Sortir le code de la base de données:  it's a technical problem

> A computer does not primarily compute in the sense of doing arithmetic. 
> They primarily are filing systems.

Richard Feynman, Idiosyncratic Thinking seminar (1985)

## TL,DR

Pourquoi migrer les procédures "stockées en base de données" (PL/SQL, inclus dans la BDD Oracle) dans un langage
mainstream ? Est-ce que la promesse faite par les LLM d'automatiser cette migration change fondamentalement la donne ?
La réponse dépend de l'objectif de cette migration.

Si l'objectif est uniquement de changer de langage, le problème est relativement simple : il s'agit de transpiler
depuis un langage procédural. Pas besoin en théorie de LLM pour cela.

## Pourquoi migrer

Voilà un premier groupe d'objectifs :

- passer d'une solution propriétaire à une solution open source ;
- recruter plus facilement ou ne pas devoir former les développeurs ;
- s'assurer que le langage sera maintenu.

Ces objectifs sont bien définis, assez facilement évaluables (x € de licences par an) et vérifiables après coup.
Que certains les appellent "exigences non fonctionnelles" (NFR) formalisées danns une "stratégie d'entreprise", ou que
d'autres les appellent "dette technique", comme chez [The fork](), n'est pas important ici.

Pour savoir si la migration sera plus rapide avec un LLM et si ces deux groupes d'objectifs seront remplis, il nous
faudra nous frotter à de la technique : en quoi ce langage est-il différent des autres ? Êtes-vous prêts à plonger ?


## Idées

C'est pas l'implémentation qui pose problème, c'est le test.

C'est pas l'implémentation qui pose problème, c'est l'intention.

C'est pas le procédural qui pose problème, c'est le batch.

C'est pas le procédural qui pose problème à la traduction: on peut utiliser un parseur/codemod.


### Orienté-objet

L'orienté-objet n'est pas la solution à tous les problèmes.
Il est utile pour maitriser la complexité essentielle, mais peut lui-même apporter de la complexité accidentelle.

Qu'est-ce que l'OOP :

- Héritage
- Polymorphisme
- grouper données et le comportement (RG) = encapsulation
- message passing (Smalltalk)

### PL/SQL

Ce qu'il y a :

- structures de contrôle : conditions (if), itération (for, while);
- fonction;
- package (mais pas en PG).

Ce qu'il n'y a pas :

- function as first-class citizen : une fonction ne peut pas prendre une fonction en paramètre, ou la retourner
- injection de dépendance
- objet = structure combinant données et fonction

En PL/SQL:

- on peut accéder à toutes les données (toutes les tables, toutes les colonnes) simultanément;
- on pourrait aussi charger un résultat SQL en mémoire (record, tableau de record) et faire du procédural

### SRP

Hors de la BDD, pour appliquer les RG dans une couche dédiée, il faut :

- lire
- appliquer les RG
- écrire

Si on prend cette version SQL

```sql
UPDATE users
SET status = 'archived' 
WHERE 1=1
    AND country = 'France'
    AND creation_date > NOW - INTERVAL '10 years'
    AND type = 'physical'
```

On peut l'écrire en JS ainsi

```js
const users = await knex
    .select('id', 'creation_date', 'status')
    .from('users')
    .where({
        country: 'France'
    });

const archivedUsers = doSomething(users);

archivedUsers.map(async (user) => {
    await knex('users').where({id: user.id}).update('status', 'archived');
});
```

Si on veut sortir ce code de la BDD, on peut toujours écrire ça.

```js
const query = `
UPDATE users
SET status = 'archived' 
WHERE 1=1
    AND country = 'France'
    AND creation_date > NOW - INTERVAL '10 years'
    AND type = 'physical'
`;

await knex.raw(query);
```

Et si on veut éviter les injections SQL, on peut écrire ça.

```js
await knex('users')
    .where({country: 'France'})
    .andWhere('creationDate', '>', moment.substract(10, 'days').calendar())
    .andWhere('type', '=', 'physical')
    .update('status', 'archived');
```

Exemple:

- à partir [d'une procédure stockée Oracle](./assets/source/integration-propositions.sql) open-source
- en faire [une version procédurale en Js](./assets/parcoursup-js/src/integration-propositions.js)

Mettre en avant :

- le batch;
- les commentaires;
- profiter du nommage pas métier des propriétés;
- l'encodage de type dans du texte.

## Annexes

### technical debt

[The fork](https://medium.com/thefork/a-proposal-methodology-for-managing-technical-debt-d208201c33df#7548).

> a backend technical component MUST be based on the latest LTS version of Node.js

[Technical debt](https://ncrafts.io/speaker/nicholassuter)

### codebase 
MDD
https://gitlab.mim-libre.fr/parcoursup/algorithmes-de-parcoursup/-/blob/master/db-setup/oracle/create-schema.sql?ref_type=heads

https://gitlab.mim-libre.fr/parcoursup/algorithmes-de-parcoursup/-/blob/master/src/main/plsql/propositions/11%20-%20Integration%20propositions.sql?ref_type=heads

### testing

https://github.com/GradedJestRisk/web-log/blob/main/Automated-testing-database.md

### transpiling

https://public.dalibo.com/formations/manuels_archives/migorpg/migorpg.handout.pdf


### OOP

https://loup-vaillant.fr/articles/deaths-of-oop