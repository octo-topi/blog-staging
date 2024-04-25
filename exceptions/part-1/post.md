# Considered harmful

Cet article est dédié à Carol Gilligan, dont la lecture m'a encouragé à trouver ma voix.

## TLDR

Tout le monde est d'accord sur le fait que, pour résoudre un problème, on peut écrire plusieurs programmes. Mais, comme le dit Martin Fowler dans Refactoring, tous ces programmes ne sont pas équivalents.

\> “N'importe qui peut écrire du code compréhensible par un ordinateur. Mais seuls les bons programmeurs savent écrivent du code compréhensible par leurs pairs.”

<br/><br/>

Cette préoccupation est présente dès les débuts de l'informatique, par exemple en 1968 avec la controverse autour de l'instruction `GOTO`. Elle est devenue un sujet à part entière dans les années 2000 avec le mouvement "Software craftsmanship", qui a produit une littérature abondante et prescriptive. 25 ans après, je pense qu'écrire du code compréhensible reste une tâche complexe : l'humilité devrait être obligatoire parmi les "software crafters". Pour prendre en compte chaque contexte d'équipe, je mets en avant le principe de "l'état de l'art" et deux pratiques associées : les standards de code et les ADR.

## Introduction

"Considered harmful", comme toutes les expressions qui ont de la saveur (pensez à "It's raining cats and dogs"), est difficile à traduire.
Elle apparaît dans les titres d'articles de journaux pour attirer l'attention du lecteur : quelque chose est considéré par quelqu'un comme préjudiciable. C'est quasiment une accusation. L'informatique est [coutumière du fait](https://en.wikipedia.org/wiki/Considered_harmful), avec près de 65 articles portant ce nom. Ces critiques permettent-elles à la discipline de progresser, de s'approcher d'une vérité ?

<br/><br/>

Je vous propose de suivre la piste de l'ancêtre de ces articles : `GOTO considered harmful`.
Vous n'aurez pas besoin d'être développeur fullstack, ni même d'être développeur tout court, pour me suivre.
Tout part de cette constatation : les programmes sont plus faciles à lire si les instructions s'exécutent les unes après les autres.
L'instruction `GOTO` modifie l'exécution "de haut en bas". Tout comme au jeu de l'oie, avec ses ponts et ses puits, `GOTO` fait brusquement avancer ou reculer le "pion" du joueur.

<br/><br/>

`GOTO` a fait irruption dans ma carrière relativement tôt, et brutalement : mon évaluation de fin d'année stipulait que j'avais fait une faute professionnelle chez le client en utilisant un `GOTO`. J'aurais apprécié une solution plus élégante à ce traitement d'erreur en PL/SQL, mais personne de mon équipe n'en connaissait. De plus, la personne qui avait un jugement aussi tranché ne voulut jamais se faire connaître : le `GOTO` resta là et moi, comme tout prestataire, au bout d'un an, je m'en allais.

<br/><br/>

Ce n'est que des années plus tard que je retrouvais, lors de mes lectures, la piste qui menait à Edsger W. Dijkstra et à la controverse du `GOTO`. Elle est intéressante en tant que fait historique, mais disons-le tout de suite, `GOTO` est absent de la plupart des langages créés à partir des années 90 (ex : Java, Javascript, Ruby), à l'exception de Go et C#.

<br/><br/>

Je trouve que cette controverse peut nous apprendre des choses sur la constitution d'un savoir partagé de la programmation.

Je vous propose d'ouvrir la piste avec les textes suivants :

- 1968 : Dijkstra, GOTO considered harmful
- 1974 : Knuth, Structured programing with Go to statements
- 1993 : McConnell, Code complete

<br/><br/>

Dans un second article, je vous propose de voir les répercutions de cette controverse dans une base de code contemporaine (API REST NodeJS), avec le sujet de la gestion des exceptions. Si vous préférez le code aux discussions historiques, sachez que le second article est auto-portant.

## L'origine

Dijkstra est un chercheur en informatique avec une solide base en mathématiques. Bien qu'il ait développé un compilateur, il est connu pour sa contribution à la théorie des graphes : un algorithme de calcul du plus court chemin porte son nom. Il s'intéresse aussi à la preuve de programme. La preuve de programme, comme la preuve de théorème en mathématique, cherche à démontrer qu'un énoncé est vrai pour toutes les valeurs possibles. On peut prouver qu'un algorithme, par exemple le crible d'Ératosthène, permet d'obtenir tous les N nombres premiers entre 0 et N.

<br/><br/>

Il remarque que certaines instructions, appelées structures de contrôle, sont faciles à utiliser dans les preuves :

- assignation : `=`
- sélection : `if`
- répétition : `for`

<br/><br/>

Toutes, sauf une : l'instruction `GOTO`. Celle-ci permet de transférer directement le contrôle (d'aller à), soit à une ligne du programme (`GOTO 200`), soit à un endroit désigné par une étiquette (`GOTO FOO`). Cette instruction de "saut" permet de modifier l'exécution classique du programme "de haut en bas" : on quitte une boucle avant la fin, on remonte quelques lignes plus haut ou plus bas, voire, on quitte le programme.

<br/><br/>

À cette époque, certains langages (PL/1, FORTRAN) ne disposent pas de mots-clefs pour certaines structures de contrôle : le `GOTO` permet de les implémenter.

```text
0: BEGIN
1: <DO_SOMETHING_WITH_N>
2: IF N > 0 THEN GOTO 1;
3: <DO_SOMETHING_UNRELATED>
```

Vous aurez peut-être reconnu ici un `do .. while`. Dijkstra pense que l'instruction `GOTO`, en plus de ne pouvoir être utilisée dans les preuves de programme, rend plus difficile la compréhension du programme par les développeurs. En 1968, il publie ses pensées dans [un article](https://github.com/octo-topi/blog-staging/tree/main/exceptions/part-1/excerpts.md#goto-considered-harmful) au ton léger, dans un journal informatique connu.

<br/><br/>

Cet article se conclut ainsi :

\> The go to statement as it stands is just too primitive; it is too much an invitation to make a mess of one’s program.
One can regard and appreciate the clauses considered as bridling its use.

<br/><br/>

## 20 ans de controverse

Cet article ne passera pas inaperçu - une controverse naît : faut-il interdire l'usage de `GOTO` pour avoir des programmes fiables ?
Ce journal publiera en 1987 (20 ans après), au titre du droit de réponse, un article en faveur du `GOTO`. Il commence par l'affirmation suivante :

\> The notion that the GOT0 is harmful is accepted almost universally, without question or doubt. The cost to business has already been hundreds of millions of dollars in excess development and maintenance costs, plus the hidden cost of programs never developed due to insufficient resources. The belief that GOTOs are harmful appears to have become a religious doctrine, unassailable by evidence.

<br/><br/>

Suit un programme très simple, en deux versions : avec et sans `GOTO`. Cet article fera lui-même l'objet de 17 réponses, chacune avec sa version du programme.

<br/><br/>

Dijkstra répondra lui aussi, par [une note lapidaire](https://github.com/octo-topi/blog-staging/tree/main/exceptions/part-1/excerpts.md#on-a-somewhat-disappointing-correspondence), intitulée "On a Somewhat disappointing correspondence".

\> The whole correspondence was carried out at a level that vividly reminded me of the intellectual climate of twenty years age, as if stagnation were the major characteristic off the computing profession, and that was a disappointment.

<br/><br/>

Si vous souhaitez jeter un coup d'œil à ces articles, ou plutôt à ce thread, nommé `“ ‘GOT0 Considered Harmful’ Considered Harmful” Considered Harmful?`), vous les trouverez [ici](https://github.com/octo-topi/blog-staging/tree/main/exceptions/part-1/assets).

## 20 ans de recherche

Une question émerge dans les années 1970 ; 2O après, elle cause toujours des réactions - parfois peu argumentées. Ce sont pourtant des années durant lesquelles beaucoup de code a été écrit, durant lesquelles des langages de haut niveau ont vu le jour : il semble à première vue que la question de la lisibilité du code soit restée un mystère.

<br/><br/>

À première vue seulement. Vous connaissez peut-être Donald Knuth pour sa citation dans le premier tweet de Devops Borat.

\> I remember very clear I cry when I finish volume 3 of Knuth.

<br/><br/>

En 1968, donc la même année que le début de la controverse, Donald Knuth publie le volume 1 de "The Art of Computer Programming", la référence historique des livres d'algorithmie. Six ans après, en 1974, il publie un article de près de 40 pages, intitulé [Structured programing with go to statements](https://github.com/octo-topi/blog-staging/tree/main/exceptions/part-1/excerpts.md#structured-programming-with-goto-statements) sur le sujet du `GOTO`. Que va-t-il en dire ? Le début donne le ton en citant un écrit politique plutôt qu'un théorème mathématique.

\> Will Utopia 84, or perhaps we should call it NEWSPEAK, contain go to statements?

<br/><br/>

Il présente ensuite des programmes dans lesquels l'usage de `GOTO` apporte des bénéfices, ainsi que d'autres dans lesquels il n'en offre pas. Son opinion est nuancée, il nous dit en substance "cela dépend du contexte". Il rapporte également cette citation de Dijkstra.

\> Please don’t fall into the trap of believing that I am terribly dogmatical about the go to statement. I have the uncomfortable feeling that others are making a religion out of it, as if the conceptual problems of programming could be solved by a single trick, by a simple form of coding discipline!

<br/><br/>

D'autres chercheurs étudieront aussi le problème, à l'aide de méthodes de terrain. En 1981, 13 ans après, Sheil compile ces publications dans un article intitulé [The psychological study of programming](https://github.com/octo-topi/blog-staging/tree/main/exceptions/part-1/excerpts.md#the-psychological-study-of-programming). Il constate qu'elles sont convaincantes dans le ton, mais pas très concluantes dans les faits.

\> Evidence suggests only that deliberately chaotic control structure degrades (programmer) performance. These experiments provide virtually no evidence for the beneficial effect of any specific method of structuring control flow.

<br/><br/>

Néanmoins, il éclaire le débat en soulignant que ce n'est pas le mot-clef du langage (`GOTO`) qui est en jeu, mais la démarche de programmation. Dijkstra promeut une démarche appelée programmation structurée, et c'est cela qui doit être examiné.

\> Either the programmer understands the structured approach to programming, in which case her code will reflect it (whether or not structured control constructs are available), or the programmer does not, in which case the presence of syntactic constructs is irrelevant.

<br/><br/>

Il ajoute aussi que les études scientifiques concernant la programmation laissent à désirer, ce qui me semble être toujours d'actualité 40 ans après.

\> Most innovations in programming languages and methodology are motivated by a belief that they will improve the performance of the programmers who use them. Although such claims are usually advanced informally, there is a growing body of research which attempts to verify them by controlled observation of programmers’ behavior. Surprisingly, these studies have found few clear effects of changes in either programming notation or practice. Less surprisingly, the computing community has paid relatively little attention to these results.

<br/><br/>

## Textes sacrés et interprétations

Nous voilà arrivés au bout de la piste. Si l'on s'arrêtait un moment pour réfléchir à ce que nous avons appris ?
Je ne pourrais pas écouter ce que tu aurais à me dire, toi lecteur, mais je peux te partager mes réflexions.

<br/><br/>

L'instruction `GOTO` est absente de la majorité des langages actuels, c'est qu'il ne doit pas être indispensable.
Mais pourquoi a-t-il réellement disparu ? Et aurait-on pu décider plus tôt de s'en passer ?
Les échanges entre experts, pendant plusieurs dizaines d'années, ne semblent pas avoir éclairci le débat.

<br/><br/>

À plus forte raison, sur des sujets plus complexes, je ne pense pas que l'on puisse avoir des certitudes :

- sur la modularité d'un programme - quel objectif de complexité cyclomatique ?
- sur le choix d'un paradigme de programmation - fonctionnel ou POO ?
- sur le choix d'une architecture applicative - faut-il faire de la Clean architecture ?

<br/><br/>

Je souhaite maintenant aborder la question qui m'intéresse le plus dans mon travail, et la mettre en perspective avec la controverse du `GOTO`. Comment écrire du code que tout le monde comprenne et puisse modifier facilement ?

<br/><br/>

Cette question s'est posée depuis les débuts de l'informatique, mais certains développeurs s'y sont particulièrement intéressés ces trente dernières années. Certains se sont désignés sous le nom de "software crafters" et utilisent les termes suivants : du code lisible, maintenable et "propre". Pendant deux ans, je me suis plongé dans le sujet. Je me suis tourné vers ceux qui faisaient autorité, et lu leurs ouvrages (sacrés). J'ai mémorisé les commandements et essayé de les mettre en pratique, mais je me suis retrouvé devant des situations qui ne me satisfaisaient pas. Comme si la règle ne pouvait pas être appliquée à la lettre, toujours et partout. Je me suis retrouvé à écrire dans ma tête des commentaires, des exégèses. À tenter de faire la différence entre la lettre et esprit de la loi. Puis je passais à un autre ouvrage : horreur, ils se contredisaient ! Comment faire ? J'espérais bien, après avoir fait tout ça, trouver une solution définitive ; pas un mode d'emploi, mais quelque chose de solide.

<br/><br/>

Je l'ai trouvé, mais ce n'était pas du tout ce que j'attendais. Voilà sa meilleure formulation : le serment de non-allégeance d'Alistair Cockburn.

\> I promise not to exclude from consideration any idea based on its source, but to consider ideas across schools and heritages in order to find the ones that best suit the current situation.

<br/><br/>

Elle me plaît pour des raisons personnelles : sa formulation est paradoxale (un serment de non-allégeance) et elle peut s'appliquer à toute autre chose que l'informatique. Cela mis à part, je la trouve pertinente pour tous les développeurs car :

- elle expose un constat : il existe plusieurs écoles de pensées ;
- elle propose une solution : chaque personne a la responsabilité d'effectuer sa propre synthèse.

<br/><br/>

J'ai ensuite eu l'occasion de travailler dans des équipes qui se revendiquaient du "craft". Je pensais trouver parmi elles un débat riche et des positions nuancées. Mon ressenti personnel, après quelques années, est que leurs avis sont souvent tranchés, sans nuances. Cela peut aller jusqu'à mettre certaines têtes à prix, sans circonstances atténuantes : les commentaires, les fonctions de plus de N lignes, les langages à typage dynamique. J'ai été surpris et un peu déçu : j'espérais plus d'humilité. Mais peut-être est-ce simplement humain : "We have met the enemy and they are ours.". Je fais probablement partie de ceux qui manquent d'humilité, à l'occasion.

<br/><br/>

Bien. Que faire donc de ces textes de référence ? Je propose de les utiliser comme un point de départ commun. Ils contiennent une base d'arguments :

- pour ouvrir une discussion (ex : McConnell écrit "Make names of routines as long as necessary" mais là le nom de ta fonction de test fait 130 caractères) ;
- plutôt que pour interdire cette discussion (ex : Robert Martin a écrit "pas de commentaire" : tu m'enlèves ce commentaire).

<br/><br/>

Ne transformons pas ces textes en arme contre les autres. Évitons le piège de la position dogmatique ; cultivons notre envie d'apprendre sans fin, stimulée par le désaccord. Et ne tombons pas non plus dans l'autre piège de la position relativiste, et basée sur l'opinion : "personne n'a raison, donc chacun fait ce qu'il veut".

<br/><br/>

Tout cela est très bien, me direz-vous, mais en pratique, comment éviter des discussions sans fin, notamment dans les revues de code si vous les pratiquez ? Une équipe de développement ne peut pas devenir une yeshiva ou une cour de monastère bouddhiste où l'on pratique le débat pendant des heures. Je vais vous répondre, mais avant cela, il nous reste encore à considérer un dernier facteur : le contexte de l'équipe.

## L'équipe

Lorsqu'un développeur découvre une codebase, il est confronté à du code qui ne lui est pas habituel, où il ne retrouve pas ses repères.
Il est tentant pour lui de rejeter sa difficulté sur l'équipe : il est "évident" que le code devrait être écrit d'une autre manière (la sienne ?). Les membres de l'équipe sont peu rigoureux, pas à la page, voire (osons le mot) incompétents. Ils le font exprès, non ?

<br/><br/>

Ce nouveau développeur rencontre deux difficultés :

- accepter qu'il n'y pas de règle évidente et qui s'applique partout, comme déjà évoqué ;
- comprendre le contexte dans lequel travaille l'équipe.

<br/><br/>

En effet, on ne choisit pas le même langage, le même design dans un contexte d'électronique embarquée ou de PC personnel, de grande distribution ou de transport de personnes. Comme le disent les sociologues : ["Context is everything"](https://github.com/octo-topi/blog-staging/tree/main/exceptions/part-1/excerpts.md#a-study-in-worker–management-relationships)

\> Human action can be rendered meaningful only by relating it to the contexts in which it takes place.

<br/><br/>

Ce phénomène est exposé dans un article sur ce blog : [l'état de l'art](https://blog.octo.com/en-finir-avec-la-dette-technique/) de l'équipe qu'il rejoint est différent de celui de l'équipe qu'il quitte.

<br/><br/>

En conséquence, en tant que nouveau développeur, lorsque je suis confronté à un choix d'implémentation qui ne me paraît pas judicieux, j'ai tendance à invoquer "le bon sens" et à le critiquer. Si je pouvais identifier les contraintes qui s'exerçaient, je comprendrais les compromis qu'a fait l'équipe. Cela ne signifie pas pour autant que la solution actuelle est toujours la bonne. Cela me permet d'évaluer si les contraintes ont changé, et si oui, reconsidérer la solution.

## Et en pratique ?

Je résume : il ne peut pas y avoir de solutions générales en ce qui concerne le développement, il ne peut y avoir que des solutions particulières, adaptées au contexte, à l'équipe. Comme l'équipe se renouvelle, et que leur mémoire est humaine, il y a fort à parier que les échanges informels ne permettront pas de transmettre cette connaissance tacite. On pourrait ainsi se retrouver à l'endroit d'où nous sommes partis : un nouveau développeur ne comprend pas les choix qui ont été faits.

<br/><br/>

Pour éviter cela, je vous proposerais dans un deuxième article deux techniques : les standards de code et les ADR.
