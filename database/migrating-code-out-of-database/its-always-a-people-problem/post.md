# Sortir le code de la base de données: it's a people's problem

> The Second Law of Consulting:
> No matter how it looks at first, it’s always a people problem.

Gerald Weinberg, The secrets of consulting 

## TL,DR

Pourquoi migrer les procédures "stockées en base de données" (PL/SQL, inclus dans la BDD Oracle) dans un langage
mainstream ? Est-ce que la promesse faite par les LLM d'automatiser cette migration change fondamentalement la donne ?
La réponse dépend de l'objectif de cette migration.

Si l'objectif est de réduire le TTM, ou que l'application réponde mieux aux besoins des utilisateurs, ou encore qu'elle puisse évoluer plus rapidement, il n'y a pas de success story au crédit des LLM. Cela est, selon moi, dû au fait que le modèle mental du domaine métier a été perdu lors de l'implémentation originelle dans l'application. C'est ce modèle mental qu'il faudrait préserver en changeant de langage sur une codebase. Or, comme il n'est pas présent dans la codebase source, il ne pourra pas être présent dans la codebase cible.

## Pourquoi migrer

Un deuxième objectif est de changer une caractéristique dynamique du système : implémenter une nouvelle fonctionnalité
doit prendre un temps raisonnable, c'est-à-dire proportionnelle à la complexité de la demande métier. Pour le dire
autrempent, on pense que l'implémentation dans une application constituée de procédures stockées sera plus longue que
dans une application utilisant un langage mainstream, étant donné un même besoin métier et un niveau de compétence
technique de l'équipe équivalent.

### Intention

> Truth can only be found in one place: the code
Robert C. Martin, Clean Code

Si l'on prend cette remarque au premier degré, il suffit de transpiler le code dans un autre langage pour résoudre nos problèmes, car toute l'information d'origine est conservée.

Ce n'est pas du tout le propos de Robert Martin, comme nous l'apprend la citation en contexte. 

> Truth can only be found in one place: the code. Only the code can truly tell you what it does. It is the only source of truly accurate information. Therefore, though comments are sometimes necessary, we will expend significant energy to minimize them.

Il nous dit que le code dit ce qu'il fait ; mais il ne nous dit pas comment trouver l'intention d'origine, pourquoi est-ce que ce code fait cela, serait-il possible de le faire autrement, est-ce que ce code contient des bugs pas encore découverts ? Ce qu'il pointe, de manière assez juste, c'est que la présence de commentaires indique que le développeur sait que cette information, l'intention, est précieuse, mais qu'elle est difficile à transmettre.  

Nous ne pouvons pas accéder aux pensées des autres, mais nous avons appris à deviner leurs intentions.
Nous faisons des corrélations statistiques entre leur comportement actuel, et nos expériences passées.
"Quand il a agi de telle manière, il avait telle intention. 
Aujourd'hui, il a agi de la même manière. Donc il doit donc avoir la même intention."

Qu'en est-il pour le code ? Pouvons-nous deviner quelle était l'intention du développeur quand il a écrit ce bout de code ? De la même manière que nous pouvons nous tromper sur l'intention d'un humain en observant son comportement, nous pouvons nous tromper sur son intention en observant son code. Sans compter que le développeur peut, de plus, se tromper sur l'intention du métier, ou sur l'implémentation qu'il choisit. Bref, il n'y a pas de relation univoque entre du code et le besoin métier.  

## Une relation univoque

Du code = une implémentation d'une solution à un problème

Or :
- une solution peut avoir plusieurs implémentations ;
- un problème peut avoir plusieurs solutions.

La description de la solution (et du problème) sont :
- dans la tête du métier, du PO, du développeur ;
- dans le code de test.

Ce qui est paradoxal, c'est que le PL/SQL est globalement un langage de script autour du SQL, et que le SQL est déclaratif. Déclaratif = pas préocuppé par les détails d'implémentation, par exemple comment joindre deux ensembles.
Or, même avec un langage déclaratif, il existe des ambiguités.

```sql
Une jointure et une sous-requête avec des NULL et de COUNT(id)
```

### LLM

Il est possible de retrouver les règles du tennis dans un programme en corrélant : 
- les règles officielles sur Wikipedia ;
- les multiples implémentations disponibles en open source.

Pour les applications spécifiques, hors solution éditeur :
- ont un modèle complexe ;
- ce modèle est peu documenté, ou les documents sont une propriété industrielle ;
- les implémentations ne sont pas publiées.

C'est pour cela que je fais l'hypothèse que les LLM ne changeront pas la donne.
Ils ne peuvent pas revenir dans le passé, dans le modèle mental des intervenants, ni deviner quelle est l'intention.

https://blog.octo.com/la-memoire-subversive-de-nos-systemes-legacy
> L'IA modifie cette dynamique. Rétro-documentation, explication de code legacy, reconstitution d'intentions implicites. Ce qui demandait des jours peut aujourd'hui s'amorcer en très peu de temps. Elle ne résout pas tout : elle peut se tromper sur l'intention d'un code, et ses réponses restent à valider.


## Orienté-objet

L'orienté-objet n'est pas la solution à tous les problèmes.
Il est utile pour maitriser la complexité essentielle, mais peut lui-même apporter de la complexité accidentelle.

Qu'est-ce que l'OOP :

- Héritage
- Polymorphisme
- grouper données et le comportement (RG) = encapsulation
- message passing (Smalltalk)

## Annexes

### OOP

https://loup-vaillant.fr/articles/deaths-of-oop



### dette technique

https://blog.octo.com/en-finir-avec-la-dette-technique

### what is actually a program

> Every computer program is a model, hatched in the mind, of a real or mental process. These processes, arising from human experience and thought, are huge in number, intricate in detail, and at any time only partially understood. They are modeled to our permanent satisfaction rarely by our computer programs. Thus even though our programs are carefully handcrafted discrete collections of symbols, mosaics of interlocking functions, they continually evolve: we change them as our perception of the model deepens, enlarges, generalizes until the model ultimately attains a metastable place within still another model with which we struggle.

Foreword by Alan Perlis of "Structure and Interpretation of Computer Programs"

### Système et connaissance 

https://blog.octo.com/defense-et-illustration-des-test-isoles-2

> Le moment le plus opportun pour relier notre compréhension d'une partie du comportement du système avec la partie correspondante du code dans la base de code est le moment où nous écrivons des tests isolés sur cette partie du comportement. Dans le cas d'une base de code legacy, cette opportunité a été manquée il y a des mois, voire des années. La complexité accidentelle a eu le dessus, et le système est devenu trop compliqué pour être vérifiable de manière modulaire et exhaustive via des tests isolés.

https://blog.octo.com/la-memoire-subversive-de-nos-systemes-legacy

> Ce mécanisme est moins une accumulation de code qu'une érosion progressive de la mémoire du système. Par système, on entend ici quelque chose de plus large que le code : les décisions qui l'ont façonné, le contexte dans lequel elles ont été prises, et les personnes qui les portaient. C'est cette totalité qui s'érode, pas seulement les lignes de code.

> L'IA modifie cette dynamique. Rétro-documentation, explication de code legacy, reconstitution d'intentions implicites. Ce qui demandait des jours peut aujourd'hui s'amorcer en très peu de temps. Elle ne résout pas tout : elle peut se tromper sur l'intention d'un code, et ses réponses restent à valider. Mais utilisée avec discernement, elle réduit suffisamment la friction pour que cet effort devienne enfin envisageable.