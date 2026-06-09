# Sortir le code de la base de données:  it's a technical problem

> A computer does not primarily compute in the sense of doing arithmetic. 
> They primarily are filing systems.

Richard Feynman, Idiosyncratic Thinking seminar (1985)

## TL,DR

Pourquoi migrer les procédures "stockées en base de données" (PL/SQL, inclus dans la BDD Oracle) dans un langage
mainstream ? Est-ce que la promesse faite par les LLM d'automatiser cette migration change fondamentalement la donne ?
La réponse dépend de l'objectif de cette migration.

Si l'objectif est uniquement de changer de langage, le problème est relativement simple et connu : il s'agit de transpiler
depuis un langage procédural. Pas besoin en théorie de LLM pour cela. 

Mais si votre objectif va au-delà, je vous invite à attendre le prochain article.

## Pourquoi migrer

Voilà un premier groupe d'objectifs :

- passer d'une solution propriétaire à une solution open source ;
- recruter plus facilement ou ne pas devoir former les développeurs ;
- s'assurer que le langage sera maintenu.

Ces objectifs sont bien définis, assez facilement évaluables (ex : x € de licences par an) et vérifiables après coup.
Que certains les appellent "exigences non fonctionnelles" (NFR) et qu'elles soient formalisées dans un document nommé "stratégie d'entreprise", ou que d'autres les appellent "dette technique" et les gèrent dans une application dédiée, comme chez [The fork](https://medium.com/thefork/a-proposal-methodology-for-managing-technical-debt-d208201c33df#7548), n'est le sujet ici.

Dans cet article, je vous propose de se limiter à ces objectifs ; d'autres objectifs seront traités dans l'article suivant.
Pour savoir si la migration sera plus rapide avec un LLM, il nous faudra nous frotter à du langage, à du code : êtes-vous prêts à plonger ? Vous serez en bonne compagnie : j'ai développé dans ce langage les dix premières années de ma vie professionnelle, puis je suis passé sur les huit dernières au Java/Js en [hexa/clean architecture](https://blog.octo.com/architecture-hexagonale-trois-principes-et-un-exemple-dimplementation). 

## Présenter le PL/SQL

Si un développeur junior était confronté pour la première fois aux procédures stockées, il perdrait ses repères car :
- le langage est procédural — or, il n'a probablement pas fait de C ou de Pascal;
- le programme n'est exécutable qu'en base de données — or, il est habitué à exécuter son programme en dehors;
- la base de données Oracle est propriétaire, et les environnements sont distants — or, il est habitué à exécuter une base open-source, comme PostgreSQL, en local ;
- la codebase ne contient aucun test automatisé — or, il est habitué, faute de tests unitaires, à des tests de bout-en-bout ;
- les programmes sont "en traitement par lot", en mode batch (exécutés par un ordonnanceur, traite un ensemble de donnés) — or, il est habitué à réagir à des appels REST et à traiter peu de données.

Ce développeur ne serait pas étonné par le SQL, qu'il connaît, et lirait assez facilement les programmes. 


Les familiers du Gilded rose comprendront très facilement [cette version PL/SQL](https://github.com/emilybache/GildedRose-Refactoring-Kata/blob/main/plsql/update_quality.sql), pour la simple raison que ce kata est essentiellement procédural.


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

## Migrer le code procédural

Si on prend cette version SQL

```sql
UPDATE users
SET status = 'archived' 
WHERE 1=1
    AND country = 'France'
    AND creation_date > NOW - INTERVAL '10 years'
    AND type = 'physical'
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

## Un cas réel

Voyons maintenant du code de production.
- à partir [d'une procédure stockée Oracle](assets/parcoursup-plsql/integration-propositions.sql) open-source
- en faire [une version procédurale en Js](./assets/parcoursup-js/src/integration-propositions.js)


## Transpiler

https://public.dalibo.com/formations/manuels_archives/migorpg/migorpg.handout.pdf

## Tester

Plus difficile qu'on ne le croit, à cause de la BDD

https://github.com/GradedJestRisk/web-log/blob/main/Automated-testing-database.md



## SRP et archi hexa

Hors de la BDD, pour appliquer les RG dans une couche dédiée, il faut :

- lire
- appliquer les RG
- écrire

Mais ce qu'on veut vraiment, c'est l'écrire en JS ainsi

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

Le but est d'extraire les RG dans une autre couche, et donc d'appauvrir le code SQL original.

Ajouter GildedRose SQL



## Clean code

Mettre en avant :

- le batch;
- les commentaires;
- profiter du nommage pas métier des propriétés;
- l'encodage de type dans du texte.

## Idées

C'est pas l'implémentation qui pose problème, c'est le test.

C'est pas l'implémentation qui pose problème, c'est l'intention.

C'est pas le procédural qui pose problème, c'est le batch.

C'est pas le procédural qui pose problème à la traduction: on peut utiliser un parseur/codemod.