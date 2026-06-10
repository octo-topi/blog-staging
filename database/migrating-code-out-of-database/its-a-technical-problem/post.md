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

## Premier contact

Lorsqu'un développeur junior est confronté pour la première fois aux procédures stockées, il est perdu car :
- les appels sont sur une connexion SQL — or, il est habitué aux API REST HTTP;
- le programme n'est exécutable qu'en base de données — or, il est habitué à exécuter son programme en dehors;
- la base de données Oracle est propriétaire, et les environnements sont distants — or, il est habitué à exécuter une base open-source, comme PostgreSQL, en local ;
- la codebase ne contient aucun test automatisé — or, il est habitué, faute de tests unitaires, à des tests de bout-en-bout ;
- les programmes sont souvent "en traitement par lot", en mode batch (exécutés par un ordonnanceur, traite un ensemble de donnés) — or, il est habitué à traiter peu de données;
- les noms de tables, de colonnes, de variables sont courts et obscurs — or, il est habitué à plus d'expressivité :
- le programme commence par la description de qui l'a modifié, quand et pourquoi (le cartouche) — or, il est habitué à placer ces informations ailleurs (gestion de sources, gestion de demandes).

Il effectue une sorte de voyage dans le temps : autres temps, autres mœurs. Cela n'est pas strictement lié au langage, mais surtout aux contraintes et aux pratiques de développement en usage dans les années dans lesquelles le code a été écrit. 

Lorsque j'ai travaillé sur du code ayant été écrit l'année de ma naissance, sur un AS/400, les noms de tables étaient générées par un programme. Les noms étaient sur huit caractères, ne comportaient que des consonnes, et n'avaient aucun rapport avec le contenu de la table : ils n'avaient aucun sens, d'ailleurs. Ce n'était pas l'œuvre du malin, mais une solution pragramatique au fait que toutes les tables devaient être stockées dans la même instance (pas de schéma) et ne pouvaient pas faire plus de huit caractères.

## Derrière l'étrange, le familier

En mettant tous ces points de côté, ce développeur comprendrait rapidement ce que fait le programme, pour deux raisons.

La première, c'est que, bien qu'il n'ait probablement jamais développé en C ou en Pascal (langages procéduraux), son langage habituel (ex : Java, Javascript) est multi-paradigme, et qu'il passe probablement une partie de son temps à écrire du code procédural. La notion de structure de contrôle (`if `, `for`, `while`), la notion de composant (`package`) et d'appel de fonctions et la notion d'exception (`throw`, `catch`) viennent des langages procéduraux. 

La deuxième, c'est qu'une bonne partie du PL/SQL, à l'image de son nom, est du SQL. C'est d'ailleurs la force de son intégration qui le rend si attractif : il n'y a rien à faire pour exécuter une requête ... à part l'écrire. Notre développeur écrit du SQL tous les jours dans ses programmes : le SQL a passé l'épreuve du temps. Notons d'ailleurs passant que le SQL est déclaratif plutôt que procédural, et donc que le PL/SQL est en fait procédural et déclaratif.   

Assez parlé, voyons un peu de code. J'ai pris à dessein du code bien connu [GildedRose](https://github.com/emilybache/GildedRose-Refactoring-Kata), pour la bonne raison qu'il est procédural :
 - la version [SQL](./assets/gilded-rose/update-quality.sql) est compacte ;
 - la version [Js](./assets/gilded-rose/update-quality.js) est verbeuse, et n'utilise pas de SQL;
 - la version [PL/SQL](./assets/gilded-rose/update-quality.psql) ressemble trait pour trait à la version Js.

Notez que la version PL/SQL aurait pu contenir les instructions SQL, et rien de plus. Le but était de vous faire voir deux structures de contrôle, `IF` et `LOOP`.

## Les limitations du PL/SQL 

Maintenant que vous avez vu votre premier code PL/SQL sans vous enfuir, voyons [un exemple avec un appel de composant](assets/parcoursup-plsql/integration-propositions.sql), à savoir une procédure. Une procédure PL/SQL, c'est une fonction qui ne retourne pas de données.

Je pourrais continuer ainsi pour toutes les fonctionnalités qui existent dans un langage procédural, par exemple le C : il y a des collections (tableaux), des exceptions, et même des variables globales. 

Ce qui manquerait rapidement à notre développeur, avec ses réflexes actuels, sont deux choses :
- l'injection de dépendance, s'il fait des tests unitaires ou de l'architecture hexagonale : les fonctions PL/SQL ne sont pas des first-class citizen (on ne peut passer ou retourner que des données) ;
- la notion de classe, s'il veut regrouper les données et le code. 

Maintenant, nous partageons suffisamment de connaissances pour réfléchir à la migration du code PL/SQL.   

## Migrer le code

Prenons cet extrait de PL/SQL ne contenant que du SQL.

```sql
UPDATE users
SET status = 'archived' 
WHERE 1=1
    AND country = 'France'
    AND creation_date > NOW - INTERVAL '10 years'
    AND type = 'physical'
```

Si on veut migrer en Javascript, le plus petit pas serait celui-ci.

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

Et bien sûr, pour éviter les injections SQL et améliorer l'expressivité, on voudrait cela.

```js
await knex('users')
    .where({country: 'France'})
    .andWhere('creationDate', '>', moment.substract(10, 'days').calendar())
    .andWhere('type', '=', 'physical')
    .update('status', 'archived');
```

Continuons avec un exemple plus consistant que celui-ci, en ajoutant du procédural, et qui soit un code de production.

Regardez côte à côté [la source](assets/parcoursup-plsql/integration-propositions.sql), puis [la cible en Js](./assets/parcoursup-js/src/integration-propositions.js).

Qu'en pensez-vous ?

## Transpiler

On peut poser le problème de manière à le résoudre simplement : si un langage fait une partie de ce que fait un autre langage, il est possible de le migrer automatiquement. Le PL/SQL étant procédural et utilisant du SQL, on peut écrire un programme qui traduit ce langage en un autre langage, du moment qu'il est, lui aussi, procédural et utilise du SQL. C'est ce qu'on appelle un transpileur.

Un autre sorte de truc est le codemod, par exemple pour passer du CJS à ESM.

C'est comme cela que la migration de procédures stockées Oracle vers les procédures stockées PostgreSQL est effectuée, [avec un transpilateur](https://public.dalibo.com/formations/manuels_archives/migorpg/migorpg.handout.pdf). Les difficultés se produisent souvent lorsqu'il manque une correspondance entre les différents langages (subsets), lorsqu'il n'existe pas d'équivalence dans le langage cible à un élément du langage source. Le PL/SQL est plus riche que le PL/pgSQL, et il faut mettre en œuvre des solutions de contournement.

Dans le cadre de cet article, le langage cible (multi-paradigme, ex : Js) est plus riche que le langage source (procédural PL/SQL), aussi le problème reste simple. 

## Tester

Plus difficile qu'on ne le croit, à cause de la BDD

https://github.com/GradedJestRisk/web-log/blob/main/Automated-testing-database.md


## La suite ?

### Scaling

Déporte une partie de la charge de travail hors de la BDD (SPOF)


### SRP et archi hexa

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

