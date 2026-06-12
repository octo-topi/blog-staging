# ParcourSup

Les bases de code en PL/SQL d'application d'entreprise sont difficiles à obtenir. Ce code est extrait de la base de code Open Source de l'application "Parcours Sup", disponible sur [Gitlab](https://gitlab.mim-libre.fr/parcoursup/algorithmes-de-parcoursup). 

Cette application est utilisée par les lycéens pour formuler leurs demandes de parcours post-bac aux établissements de l'enseignement supérieur.

Elle est composée de Java et de PL/SQL sur une base de données relationnelle Oracle. Il est possible [d'installer en local](https://gitlab.mim-libre.fr/parcoursup/algorithmes-de-parcoursup/-/blob/master/README.md) l'application, mais pour se concentrer sur un seul composant, je l'ai extrait dans cette codebase.

## Source 

[Le composant à migrer](https://gitlab.mim-libre.fr/parcoursup/algorithmes-de-parcoursup/-/blob/master/src/main/plsql/propositions/11%20-%20Integration%20propositions.sql?ref_type=heads) est un bloc anonyme PL/SQL, nommé "intégration de propositions".

Un bloc anonyme est la structure la plus simple en PL/SQL, c'est l'équivalent d'un script bash. Ce n'est pas une fonction ou un module, au sens où il n'a pas de signature : il n'a pas de nom, pas de déclaration de paramètres. Le plus important pour notre cas, c'est qu'il contient les structures de base du PL/SQL. 

[Le schéma de base de données](https://gitlab.mim-libre.fr/parcoursup/algorithmes-de-parcoursup/-/blob/master/db-setup/oracle/create-schema.sql?ref_type=heads) comporte des tables, des vues et des fonctions.

## Cible

[Le composant migré](../parcoursup-js/src/integration-propositions.js) est un composant Js.

La base de code est en NodeJs, au format CommonJS. Le package manager est npm, le composant accède à la base de donnée via un query builder (Knex).

Un conteneur PostgreSQL local est fourni, ainsi que le script de création de schéma, limité aux 4 tables utilisées par le composant.

Pour installer les dépendances, démarrer la base de données, créer le schéma et exécuter le composant, exécutez ces commandes.

```shell
nvm use .
npm install
npm run database:start
npm run database:create-schema
npm run start
npm run integration-propositions
```

 

