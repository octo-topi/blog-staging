# Sortir le code de la base de données:  it's a technical problem

> The Second Law of Consulting:
> No matter how it looks at first, it’s always a people problem.

Gerald Weinberg, The secrets of consulting (1985)

## TL,DR

J'entends en ce moment le promesse que les LLM vont permettre de migrer automatiquement les procédures "stockées en base de données" (PL/SQL, inclus dans la BDD Oracle) vers des langages mainstream.

Quelle est l'objectif de cette migration ? S'il s'agit uniquement de changer de langage, par exemple pour ne plus payer de licences Oracle, le problème est technique, et la solution est technique. Elle est d'ailleurs connue depuis longtemps, et ne requiert pas de LLM, mais un transpileur. Il y a quelques précautions à prendre, mais il y a peu de risques. Préparez-vous, dans cet article, à de la technique !

Mais si vous avez un autre objectif, disons que l'application évolue plus rapidement, le problème n'est plus du tout technique, et je ne vois pas comment les LLM changeraient la donne. Cela sera l'objet du prochain article, qui parlera de traduction avec Umberto Eco, de modèles mentaux avec Alan Perlis, et de mémoire (et d'oubli) dans les systèmes sociaux-techniques.

## Pourquoi migrer

Voilà un premier groupe d'objectifs :

- passer d'une solution propriétaire à une solution open source ;
- recruter plus facilement ou ne pas devoir former les développeurs ;
- s'assurer que le langage sera maintenu.

Ces objectifs sont bien définis, assez facilement évaluables (ex : x € de licences par an) et vérifiables après coup.
Que certains les appellent "exigences non fonctionnelles" (NFR) et qu'elles soient formalisées dans un document nommé "stratégie d'entreprise", ou que d'autres les appellent "dette technique" et les gèrent dans une application dédiée, comme chez [The fork](https://medium.com/thefork/a-proposal-methodology-for-managing-technical-debt-d208201c33df#7548), n'est le sujet ici.

Dans cet article, je vous propose de se limiter à ces objectifs ; d'autres objectifs seront traités dans l'article suivant.
Pour savoir si la migration sera plus rapide avec un LLM, il nous faudra nous frotter à du langage, à du code : êtes-vous prêts à plonger ? Vous serez en bonne compagnie : j'ai développé dans ce langage les dix premières années de ma vie professionnelle, puis je suis passé sur les huit dernières au Java/Js en [hexa/clean architecture](https://blog.octo.com/architecture-hexagonale-trois-principes-et-un-exemple-dimplementation). 

## Premier contact avec le PL/SQL

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

Maintenant que vous avez vu votre premier code PL/SQL sans vous enfuir, voyons [un exemple avec un appel de composant](assets/parcoursup-plsql/integration-propositions.sql), à savoir une procédure. Une procédure PL/SQL, c'est une fonction qui ne retourne pas de données.

Je pourrais continuer ainsi pour toutes les fonctionnalités qui existent dans un langage procédural, par exemple le C : il y a des collections (tableaux), des exceptions, et même des variables globales. 

Ce qui manquerait rapidement à notre développeur, avec ses réflexes actuels, sont deux choses :
- l'injection de dépendance, s'il fait des tests unitaires ou de l'architecture hexagonale : les fonctions PL/SQL ne sont pas des first-class citizen (on ne peut passer ou retourner que des données) ;
- la notion de classe, s'il veut regrouper les données et le code. 

Maintenant, nous partageons suffisamment de connaissances pour réfléchir à la migration du code PL/SQL.   

## Le problème

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

Qu'en pensez-vous ? Est-ce que le problème vous paraît difficile à résoudre ?

## La solution

Posons le problème ainsi : si un langage fait une partie (subset) de ce que fait un autre langage, il est en théorie possible de le migrer vers cet autre langage. S'il en fait plus, ça se corse. Le PL/SQL étant procédural et utilisant du SQL, on peut le migrer vers un langage du moment qu'il est, lui aussi, procédural et utilise du SQL, par exemple Javascript. Bien. 

Qu'en est-il maintenant d'écrire un programme qui traduit un programme ce langage vers un autre langage ? Vous connaissez probablement les transpileurs, qui font exactement cela, à la volée. Pour notre part, nous n'avons pas besoin de le faire à la volée, une seule migration suffit : le code PL/SQL ne sera plus maintenu.

Ces outils de migration s'appellent des codemod, dont [voici un exemple d'utilisation en Js](https://engineering.pix.fr/javascript/2023/08/25/migrer-de-commonjs-vers-esm.html#une-solution-complexe-et-puissante--les-codemods).

Il existe des codemod sur le PL/SQL, par exemple [vers les procédures stockées PostgreSQL](https://github.com/darold/ora2pg/blob/master/lib/Ora2Pg/PLSQL.pm#L751), nommées PL/pgSQL. Les difficultés se produisent lorsqu'il manque une correspondance entre les différents langages : le PL/SQL est plus riche que le PL/pgSQL. Dans le cadre de cet article, le langage cible (multi-paradigme, ex : Js) est plus riche que le langage source (procédural PL/SQL), aussi, il est simple d'écire un codemod pour effectuer cette migration.

Cela ne veut pas dire que la tâche soit à la portée de n'importe quel développeur, ni même qu'il existe des librairies open source qui le fassent déjà. Ce sont des compétences spécifiques. Le codemod ci-dessus utilise des expressions régulières, mais en général, on utilise un parseur et une grammaire PL/SQL. Cela veut dire que le problème de migrer une base de code PL/SQL peut être effectuée avec des outils conventionnels, et qu'il n'y a pas besoin pour cela de LLM.

## On va en production ?

Faisons l'hypothèse que l'état, comme dans [cet exemple](https://www.linkedin.com/posts/oblanc_gnucobol-cobol-java-activity-7325816094777094144-9U8S), ou que les entreprises privées, via des financements de fondations open source, permettent le développement d'un programme qui porte le PL/SQL en langage actuel. Ce programme, cette librairie, est testée et maintenue par la communauté.

Demain, vous avez cet outil, et votre codebase. Vous ouvrez une PR et hop, vous mergez ? Bien sûr que non. Vous ferez tout d'abord des tests manuels, en local, puis sur des jeux de tests plus proches de la production. Vous avez probablement une équipe de QA prête une campagne de tests de non-régression, n'est-ce pas ? J'espère, parce qu'en général, les tests automatisés ne faisaient pas partie des pratiques de développement à la grande époque du PL/SQL. 

Comment ça, on vous a dit que les tests manuels coutaient cher, même outsourcés en Inde, et que les LLM le feraient bien mieux ? Voilà qui devient intéressant ! Tout le monde, et [les professionnels du test](https://istqb.org/) les permiers, est d'accord sur le fait que l'humain n'excelle pas dans les tâches répétitives où il faut maintenir une attention prolongée, comme une campagne de tests de non-régression. Un programme s'en sort bien mieux, et est imbattable en termes de coût une fois la suite de test écrite. 

Bien. Comment écrire cette suite de test, et en quoi les LLM pourraient-ils nous aider ? 

Cela fait plus de vingt ans que la technique du [Golden Master](https://en.wikipedia.org/wiki/Characterization_test) est connue, depuis la parution du livre Legacy Code de Feathers. Pour rappel, cela consisterait à exécuter le point d'entrée PL/SQL avec une entrée et enregistrer la sortie, puis d'appliquer cette entrée au composant Js, et de vérifier que sa sortie est égale à cette préalablement enregistrée. Si la sortie n'est pas égale, il y a régression. La force de cette technique réside dans le fait que l'on ne fait aucune hypothèse sur ce que le code devrait faire — ce qui demanderait un travail intellectuel, notamment de lire le code. A la place, on fait un travail d'observation, purement mécanique : que fait le code ? En général, l'automate génère suffisamment d'entrées pour que tout le code soit couvert. Pour le savoir, il instrumente le code à tester, afin si toutes les instructions, ou branches, ont été couvertes. 

Qu'en est-il en PL/SQL ? Tout d'abord, bien qu'il existe [une solution d'instrumentation](https://docs.oracle.com/en/database/oracle/oracle-database/12.2/adfns/basic-block-coverage.html) du code PL/SQL, je ne pense pas qu'il soit possible de garantir que les tests soient exhaustifs, qu'on utilise un programme classique ou un LLM. C'est un sujet complexe, [sur lequel j'ai écrit](https://github.com/GradedJestRisk/web-log/blob/main/Automated-testing-database.md) lorsque je suis sorti du monde PL/SQL, mais je vais essayer de le résumer.

## Le Golden Master en SQL 

### La couverture

Le problème réside dans la nature même du SQL. Si le PL/SQL n'utilisait pas de SQL, on pourrait utiliser les techniques classiques de Golden Master. Or, le PL/SQL utilise intensivement le SQL. Ce qui veut dire, en passant, qu'on aura des difficultés à utiliser le Golden Master sur un code NodeJs s'il utilise intensivement le SQL. Voyons voir pourquoi.

Une fonction peut modifier l'état d'un système de plusieurs manières :
- renvoyer une valeur à l'appelant ;
- appeler un autre composant ;
- modifier la mémoire :
  - en modifiant l'état d'un objet dont il possède une référence;
  - en modifiant une variable globale ;
- modifier le filesystem, en écrivant un fichier ;
- faire un appel réseau : appel REST, appel SQL.

Il existe des techniques éprouvées pour tester (faire des assertions sur) chacun de ces points, notamment en utilisant les doublures de composants, le mocking du réseau ou du filesystem. Le coverage est disponible sur chaque ligne de code qui effectue ces actions ; on peut donc lancer les tests et vérifier qu'ils ont exécuté chacune de ces lignes.

Mais qu'en est-il avec un appel SQL ? On peut vérifier qu'on a appellé la base de données avec telle requête SQL, mais cela ne fait que déplacer la question : est-ce que la requête fait ce que l'on veut qu'elle fasse, à savoir sur les données en base de données ? 

Quand, lorsqu'on développe une fonctionnalité, on écrit un test automatisé sur un composant utilisant une requête SQL, on vérifie que le comportement obtenu est celui attendu, par exemple que la valeur renvoyée par le composant est bien celle qui était présente en base de données, ou encore que la donnée présente en base de données est bien celle qui a été créée par le composant.

### Un exemple

Prenons cette requête.
```sql
UPDATE users
SET status = 'archived' 
WHERE country != 'France'
```

Je vais écrire deux cas de tests :
- étant donné plusieurs enregistrements avec un `country` qui n'est pas `France`, et un statut différent de `archived`, appeler la requête, puis vérifier que le statut est `archived` ensuite ;
- étant donné plusieurs enregistrements avec un `country` qui est `France`, et un statut différent de `archived`, appeler la requête, puis vérifier que le statut n'a pas changé.

Notez que je ne teste pas le cas suivant : étant donné plusieurs enregistrements avec un `country` qui n'a pas de valeur (`NULL`), et un statut différent de `archived`, appeler la requête, puis vérifier que le statut n'a pas changé. Pourquoi ? Cela peut être pour deux raisons : la première, c'est que le champ `country` n'est par définition jamais NULL. Le deuxième, c'est que je ne me suis jamais posé la question, ou que le métier ne souhaite pas y répondre, car "cela n'arrivera jamais". 

Je n'ai pas non plus testé le cas suivant : étant donné un enregistrement avec un `country` qui n'est pas `France`, et un statut différent de `archived`, appeler la requête, qu'aucune exception de type `duplicate key` ou `foreign key violated` . Je sais qu'il n'y a pas de contrainte d'unicité sur le champ `status`, ni de clef étrangère de `status` vers une table de statut (qui ne contiendrait pas la aleur `archived`), ni de contrainte `CHECK` sur le champ `status` avec une liste de valeurs.

Maintenant, imaginez que je n'ai pas écrit de test automatisé pendant le développement, et de plus que j'ai quitté l'équipe. Un jour, on veut constituer un Golden Master. Personne ne peut savoir ce que le code doit faire, aussi, combien de cas de tests doit-on générer ? Si j'utilise un LLM pour générer ces cas de test automatiquement, et que je lui fais générer des entrées (tuples dans la table `users` ) aléatoirement jusqu'à ce que test soit couvrant, je suis dans l'impasse : on n'a pas d'instrumentation pour dire que le test est couvrant. La seule couverture porte sur le fait que le code a envoyé la requête SQL, pas que le test a vérifié le comportement.  

On a donc besoin à la fois de connaître le modèle de données, et la sémantique de SQL pour générer les jeux de données et les tests décrits ci-dessus. Et pour cela, on a surtout besoin de parseurs SQL et d'outil d'introspection de modèles de données, plutôt que de LLM.

### Une requête a du sens dans un système

Un dernier exemple : si notre requête `SELECT` comporte N tables jointes les unes avec les autres, il nous faut au minimum N+1 tests (ou un test avec N+1 tuples) qui vérifient que :
- la requête renvoie un tuple si tous les critères de jointure sont satisfaits ;  
- la requête ne renvoie aucun tuple si un critère de jointure n'est pas satisfait (et ce, pour chaque table).

Vous pourriez objecter que, par design des traitements qui alimentent ces tables, ces critères de jointure sont toujours respectés, et que d'ailleurs des contraintes d'intégrité référentielle les rendent obligatoires. Je suis absolument d'accord, et j'en viens à un point qui me semble fondamental.

Une requête SQL ne peut pas être considérée de manière isolée, elle a du sens dans un système composé :
- d'un modèle de données (contraintes d'intégrité, de nullité) ;
- de données (existence ou absence de valeurs, plages) ;
- de toutes les autres requêtes (dans tous les autres programmes).   

Je pense aussi, mais je n'irai pas plus loin ici, qu'en présence de requêtes complexes, en se basant sur un parseur SQL, on obtiendrait un nombre de tests générés trop important pour être exécutés. En effet, certains opérateurs SQL sont complexes et peuvent effectuer de multiples opérations. Combinés dans une requête, sur plusieurs tables, on assisterait à une explosion combinatoire.

Pour vous en convaincre, pensez :  
- aux opérateurs de jointure : `INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`, `FULL OUTER JOIN`, `CROSS JOIN`, `SELF JOIN`.
`EXISTS`, `IN`;
- aux sous-requêtes et leurs opérateurs d'existence (`IN`, `EXISTS`);
- aux CTE (`WITH`), aux requêtes récursives. 

La conclusion est la suivante : comme on peut préserver le SQL lors de la migration PL/SQL vers un autre langage, autant ne pas générer de tests. S'ils étaient générés par un parseur SQL, ils seraient trop nombreux donc inutiles. S'ils étaient générés par un LLM, ils donneraient une fausse impression de sécurité.

## Et après ?

Avant de nous séparer, jetons un coup d'œil sur ce que l'on pourrait avoir envie de faire une fois le code PL/SQL migré. Parlons de design applicatif. Il y a de nombreuses discussions, mais on peut revenir aux basiques : le design applicatif, c'est comment on range le code, autrement dit sur quels critères on sépare le code que l'on écrit en composants.

Je prends des critères qui remontent à 2003 (Fowler, Patterns of Enterprise Application Architecture, Part 1 : Three Principal Layers), mais qui sont toujours présents dans des choix actuels type Functional/Hexagonal/Clean Architecture :
- Presentation;
- Domain : règles de gestion métier ;
- Data Source : base de données, API REST, middleware.

En PL/SQL, on peut allégrement tout faire à un seul endroit, pour au moins deux raisons : l'accès à la base de données est très facile et certaines techniques de séparation de code (namespace, package, injection de dépendances) ne sont pas disponibles, ou limitées, en PL/SQL.

Essayons, en reprenant l'exemple précédent, d'extraire du SQL migré les règles métiers.
```js
await knex('users')
    .where({country: 'France'})
    .andWhere('creationDate', '>', moment.substract(10, 'days').calendar())
    .andWhere('type', '=', 'physical')
    .update('status', 'archived');
```

Si je sépare rapidement la règle de gestion d'archivage (Domain) du SQL (Data Source), je peux obtenir cela.
```js
const users = await knex
    .select('id', 'creation_date', 'status')
    .from('users')
    .where({
        country: 'France'
    });

const archivedUsers = archive(users);

archivedUsers.map(async (user) => {
    await knex('users').where({id: user.id}).update('status', 'archived');
});
```

La règle de gestion "Archiver les utilisateurs physiques dont le compte a été créé depuis au moins 10 ans" a disparu de la couche "Datasource" pour arriver dans la couche "Domain" (la fonction `archive()`).

Enfin, pas tout à fait. La règle de gestion ne concerne que les utilisateurs français, or, elle n'apparaît pas dans la couche "Domain". C'est un choix délibéré lié à la cardinalité de la table : les utilisateurs français représentent une fraction de la table, alors qu'on ne pourrait pas monter la totalité des utilisateurs en mémoire. Ainsi, des considérations de performance se révélent, et limitent les choix de design.

Si l'on cherchait à automatiser la migration du code vers la couche "Domain" avec un LLM, il devrait avoir connaissance des éléments de contexte que sont les données, leur cardinalité et leur répartition statistique, pour faire des choix performants. Je serais curieux de savoir si le code migré par LLM exposerait clairement les règles de gestion métier, ou s'il serait structuré artificiellement et rendrait la compréhension plus difficile que de tout laisser dans "Data Source". 

À la lumière de ce que nous venons de voir (et nous avons vu beaucoup de choses), je vous propose de continuer la réflexion sur d'autres objectifs de migration. Ce sera dans un autre article, publié dans quelques semaines. Bon été !