# Sortir le code de la base de données

## Pourquoi

Pour sortir d'une solution propriétaire

Pour recruter plus facilement

Pour ne pas devoir former les développeurs

Pour tester unitairement les comportements

## Idées

C'est pas l'implémentation qui pose problème, c'est le test.

C'est pas l'implémentation qui pose problème, c'est l'intention.

C'est pas le procédural qui pose problème, c'est le batch.

C'est pas le procédural qui pose problème à la traduction: on peut utiliser un parseur/codemod.

Exemple:

- à partir [d'une procédure stockée Oracle](./assets/source/integration-propositions.sql) open-source
- en faire [une version procédurale en Js](./assets/parcoursup-js/src/integration-propositions.js)

Mettre en avant :

- le batch;
- les commentaires;
- profiter du nommage pas métier des propriétés;
- l'encodage de type dans du texte.

## Annexes

MDD
https://gitlab.mim-libre.fr/parcoursup/algorithmes-de-parcoursup/-/blob/master/db-setup/oracle/create-schema.sql?ref_type=heads

https://gitlab.mim-libre.fr/parcoursup/algorithmes-de-parcoursup/-/blob/master/src/main/plsql/propositions/11%20-%20Integration%20propositions.sql?ref_type=heads

https://github.com/GradedJestRisk/web-log/blob/main/Automated-testing-database.md

https://public.dalibo.com/formations/manuels_archives/migorpg/migorpg.handout.pdf