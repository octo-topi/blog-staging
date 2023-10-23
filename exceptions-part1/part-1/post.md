# The one considered harmful

## Introduction
GOTO a fait irruption dans ma vie relativement tôt, et brutalement : mon évaluation de fin d'année stipulait que mon usage de GOTO chez le client et constituait une faute professionnelle. J'aurais apprécié une solution plus élégante à ces quelques lignes dans un traitement d'erreur imbriqué en PL/SQL, difficile à lire sans [GOTO](https://docs.oracle.com/en/database/oracle/oracle-database/21/lnpls/GOTO-statement.html). Malheureusement, la personne qui avait un jugement aussi tranché ne voulut jamais se faire connaître : le GOTO resta là et moi, je m'en allais.

Ce n'est que des années plus tard que je retrouvais, lors de mes lectures, la piste qui menait à Edsger W. Dijkstra et à la controverse. Elle est intéressante en tant que fait historique, mais est obsolète : il n'y a pas de `GOTO` en Java et NodeJs.

Pour ma part, je trouve que cette controverse nous apprend bien des choses sur les développeurs en tant que groupe social et sur la constitution d'un savoir partagé. Cette controverse continue aujourd'hui, sous d'autres formes.

Je vous propose d'ouvrir la piste avec les ouvrages suivants :
- 1968 : Dijkstra, GOTO considered harmful 
- 1974 : Knuth, Structured programing with Go to statements
- 1993 : McConnell, Code complete

Dans [un second article](../part-2/post.md), je vous propose de voir les répercutions dans une base de code contemporaine (API en clean architecture).

## L'origine

En 1968, Dijkstra est un chercheur en informatique avec une solide base de mathématique, il s'intéresse à la preuve de programme.
La preuve de programme, comme la preuve de théorème en mathématique, cherche à démontrer qu'un énoncé est vrai pour toutes les valeurs possibles.
En informatique, on peut prouver que l'algorithme de crible d'Ératosthène permet d'obtenir tous les N nombres premiers entre 0 et N.
Ce chercheur remarque que les instructions simples ( assignation `=` , sélection `if` , répétition `for` , aussi appelées structures de contrôle) sont faciles à utiliser dans les preuves.
Par contre, une instruction se prête mal aux preuves de programme, l'instruction `GOTO`.

Elle permet de se rendre, soit à une ligne du programme (`GOTO 200`), soit à un endroit désigné par une étiquette (`GOTO FOO`).
A cette époque, les langages n'implémentent pas nativement toutes les structures de contrôle, et le `GOTO` permet de les implémenter, comme ici pour le `do/while`.
```
0: BEGIN
1: <DO_SOMETHING_WITH_N>
2: IF N > 0 THEN GOTO 1;
```

Cette instruction de "saut" modifie l'exécution du programme en lui faisant quitter les boucles, remonter au début ou aller directement à la fin (voir ces exemples).
Ce chercheur pense que cet opérateur rend la compréhension des programmes compliquée pour les développeurs. 
Il publie ses pensées dans un article léger, dans le journal informatique de l'époque. Son article se conclut par :
> The go to statement as it stands is just too primitive; it is too much an invitation to make a mess of one’s program. 
> One can regard and appreciate the clauses considered as bridling its use.

## 20 ans de controverse

Cet article ne passera pas inaperçu, et une controverse a bientôt lieu dans ces termes : faut-il interdire l'usage de `GOTO` pour avoir des programmes fiables ?

Le journal publiera une réponse 20 ans après, en 1987 en faveur du `GOTO`. Il commence par l'affirmation suivante :
> The notion that the GOT0 is harmful is accepted almost universally, without question or doubt. The cost to business has already been hundreds of millions of dollars in excess development and maintenance costs, plus the hidden cost of programs never developed due to insufficient resources. The belief that GOTOs are harmful appears to have become a religious doctrine, unassailable by evidence.

Puis un programme très simple est inclus, en deux versions : avec et sans GOTO. Cet article fera lui-même l'objet d'un nombre de réponses records, avec 17 autres versions du même programme.

Dijkstra répondra par une note, intitulée "On a Somewhat disappointing correspondence".
> The whole correspondence was carried out at a level that vividly reminded me of the intellectual climate of twenty years age, as if stagnation were the major characteristic off the computing profession, and that was a disappointment.

## 20 ans de publications

Une question émerge dans les années 1970 ; 2O après, elle cause autant de réactions épidermiques et peu argumentées. Ce sont des années pendant lesquelles beaucoup de code a été écrit, des langages ont vu le jour, mais il semble que la connaissance n'ait pas progressé.

En 1974, donc six ans après l'article originel, Donald Knuth (une des références en algorithmie), publie un article de près de 40 pages citant des cas dans lequel l'usage de `GOTO` apporte des bénéfices, et d'autres dans lequel il n'en offre pas. Il rapporte cette citation de Dijkstra.
> Please don’t fall into the trap of believing that I am terribly dogmatical about the go to statement. I have the uncomfortable feeling that others are making a religion out of it, as if the conceptual problems of programming could be solved by a single trick, by a simple form of coding discipline!"

D'autres publications suivront, convaincantes dans le ton, mais pas très concluantes dans les faits. Voilà ce qu'en dit Sheil en 1981, après avoir compilé la majorité d'entre elles. 
> Evidence suggests only that deliberately chaotic control structure degrades (programmer) performance. These experiments provide virtually no evidence for the beneficial effect of any specific method of structuring control flow.

## Ce qui est en jeu

J'ai constaté que lorsqu'une question d'intelligibilité de code est posée, les avis sont souvent tranchés. Les participants ne mentionnent pas que ce sont leurs avis personnels, leurs préférences de style. Ils se réfèrent à des autorités, à des ouvrages, dont la règle devrait être appliquée à la lettre, toujours et partout. Mais l'histoire de l'informatique a des choses à leur apprendre, s'ils ouvrent les yeux.

Nous disposons d'un cas simple. L'instruction `GOTO` n'existe plus dans les languages actuels (conçus à partir des années 2000, comme Java), c'est donc qu'on peut s'en passer. Pourtant, les experts du domaine n'étaient pas d'accord, et 20 ans de pratique n'a pas apporté de preuve explicite. 

Dans ce cas, sur des débats plus complexes, comme la taille d'une fonction, la complexité cyclomatique, ou l'utilité de l'orienté-objet, comment espérer avoir des certitudes ?

Je préfère considérer les différences de style, les désaccords d'implémentations comme une opportunité d'apprendre et de réfléchir plus profondément, et une occasion d'apprendre à travailler ensemble. J'apprécie la démarche d'Alistair Cockburn et son vœu de non-allégeance.
> I promise not to exclude from consideration any idea based on its source, but to consider ideas across schools and heritages in order to find the ones that best suit the current situation.

## Ouverture

Lorsqu'un développeur découvre une codebase, il est confronté à du code qui ne lui est pas habituel, où il ne retrouve pas ses repères.
Bien qu'un certain nombre de styles d'écriture soient reconnus et conseillés, [l'état de l'art](https://blog.octo.com/en-finir-avec-la-dette-technique/) de l'équipe qu'il rejoint est différent de celui de l'équipe qu'il quitte. Je pense qu'il est tentant de rejeter cette difficulté sur l'équipe : il est "évident" que le code devrait être écrit d'une certaine manière (la sienne) ; puisqu'il ne l'est pas, c'est que ces membres sont paresseux, peu rigoureux, voire incompétents. 

Pour contrer cette tendance, ce biais personnel, je me rappelle l'adage "Context is everything" : mettre les choses dans leur contexte.
L'origine probable de cet adage sont les sciences sociales, à savoir Alex Gouldner.
> Human action can be rendered meaningful only by relating it to the contexts in which it takes place.
> This is commonly recognized in the saying that there is a “time and a place for everything”.

Lorsque je suis confronté à un choix d'implémentation qui ne me paraît pas judicieux, je cherche à identifier les contraintes qui s'exerçaient, les compromis qu'a fait l'équipe. Cela ne signifie pas que la solution actuelle soit la meilleure, et appeler à l'inaction. Cela signifie que si je veux modifier la solution, il me faut identifier les forces en présences et utiliser les bons effets de levier dans le système, plutôt que d'invoquer "le bon sens".

Il existe des techniques spécialement conçues pour partager ce savoir dans l'équipe. Je vous propose deux d'entre elles en action, les standards de code et les ADR, dans le [deuxième article](../part-2/post.md), où le GOTO refait surface.