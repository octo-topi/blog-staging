# The one considered harmful

## Introduction
GOTO a fait irruption dans ma carrière relativement tôt, et brutalement : mon évaluation de fin d'année stipulait que j'avais fait une faute professionnelle chez le client en utilisant un `GOTO`. J'aurais apprécié une solution plus élégante à ce traitement d'erreur en PL/SQL, mais personne de mon équipe n'en connaissait. De plus, la personne qui avait un jugement aussi tranché ne voulut jamais se faire connaître : le `GOTO` resta là et moi, comme tout prestataire, au bout d'un an, je m'en allais.

Ce n'est que des années plus tard que je retrouvais, lors de mes lectures, la piste qui menait à Edsger W. Dijkstra et à la controverse du `GOTO`. Elle est intéressante en tant que fait historique, mais disons-le tout de suite, `GOTO` est absent de la plupart des langages créés à partir des années 90 (ex: Java, Javascript, Ruby), à l'exception de Go et C#.

Ceci dit, je trouve que cette controverse peut nous apprendre des choses sur les développeurs en tant que groupe social et sur la constitution d'un savoir partagé. De plus, cette controverse continue aujourd'hui, sous d'autres formes.

Je vous propose d'ouvrir la piste avec les textes suivants :
- 1968 : Dijkstra, GOTO considered harmful 
- 1974 : Knuth, Structured programing with Go to statements
- 1993 : McConnell, Code complete

Dans [un second article](../part-2/post.md), je vous propose de voir les répercutions dans une base de code contemporaine (API REST).

## L'origine

En 1968, Dijkstra est un chercheur en informatique avec une solide base de mathématique, il s'intéresse à la preuve de programme.
La preuve de programme, comme la preuve de théorème en mathématique, cherche à démontrer qu'un énoncé est vrai pour toutes les valeurs possibles.
On peut prouver qu'un algorithme, par exemple le crible d'Ératosthène, permet d'obtenir tous les N nombres premiers entre 0 et N.

Dijkstra remarque que certaines instructions parmis les structures de contrôle sont faciles à utiliser dans les preuves :
* assignation : `=`
* sélection : `if`
* répétition : `for` 

Par contre, une instruction se prête mal aux preuves de programme, l'instruction `GOTO`. Celle-ci permet de transférer le contrôle (aller à), soit à une ligne du programme (`GOTO 200`), soit à un endroit désigné par une étiquette (`GOTO FOO`). Cette instruction de "saut" permet de modifier l'exécution classique du programme "de haut en bas" en lui faisant quitter une boucle, remonter au début d'un programme ou aller directement à la fin.

À cette époque où les langages (PL/1, FORTRAN) ne disposent pas de toutes les structures de contrôle, le `GOTO` permet de les implémenter.
```
0: BEGIN
1: <DO_SOMETHING_WITH_N>
2: IF N > 0 THEN GOTO 1;
```
Vous aurez peut-être reconnu ici un `do .. while`.

Ce chercheur pense que cet opérateur rend la compréhension des programmes compliquée pour les développeurs. 
Il publie ses pensées dans [un article léger](./summary.md), dans le journal informatique de l'époque. Il conclue ainsi:
> The go to statement as it stands is just too primitive; it is too much an invitation to make a mess of one’s program. 
> One can regard and appreciate the clauses considered as bridling its use.

## 20 ans de controverse

Cet article ne passera pas inaperçu, et une controverse a bientôt lieu dans ces termes : faut-il interdire l'usage de `GOTO` pour avoir des programmes fiables ?

Le journal publiera une réponse 20 ans après, en 1987, en faveur du `GOTO`. Il commence par l'affirmation suivante :
> The notion that the GOT0 is harmful is accepted almost universally, without question or doubt. The cost to business has already been hundreds of millions of dollars in excess development and maintenance costs, plus the hidden cost of programs never developed due to insufficient resources. The belief that GOTOs are harmful appears to have become a religious doctrine, unassailable by evidence.

Puis un programme très simple est inclus, en deux versions : avec et sans GOTO. Cet article fera lui-même l'objet d'un nombre de réponses record, avec 17 autres versions du même programme.

Dijkstra répondra par [une note lapidaire](./summary.md), intitulée "On a Somewhat disappointing correspondence".
> The whole correspondence was carried out at a level that vividly reminded me of the intellectual climate of twenty years age, as if stagnation were the major characteristic off the computing profession, and that was a disappointment.

## 20 ans de recherche

Une question émerge dans les années 1970 ; 2O après, elle cause toujours des réactions peu argumentées. Ce sont des années durant lesquelles beaucoup de code a été écrit, durant lesquelles des langages de haut niveau ont vu le jour, mais il ne me semble pas que cela ait pu faire avancer la compréhension de la lisibilité du code.

En 1974, donc six ans après l'article originel, Donald Knuth, une des références en algorithmie, publie un article de près de 40 pages citant des cas dans lequel l'usage de `GOTO` apporte des bénéfices, et d'autres dans lequel il n'en offre pas. Il rapporte également cette citation de Dijkstra.
> Please don’t fall into the trap of believing that I am terribly dogmatical about the go to statement. I have the uncomfortable feeling that others are making a religion out of it, as if the conceptual problems of programming could be solved by a single trick, by a simple form of coding discipline!

D'autres publications suivront, convaincantes dans le ton, mais pas très concluantes dans les faits. Voilà ce [qu'en dit Sheil](./summary.md) en 1981, après avoir compilé la majorité d'entre elles. 
> Evidence suggests only that deliberately chaotic control structure degrades (programmer) performance. These experiments provide virtually no evidence for the beneficial effect of any specific method of structuring control flow.

Mais il fait un pas important en décentrant le débat. La question n'est pas le mot-clef du langage, mais le style de programmation (ce que Dijkstra appelle la discipline, en l'occurrence la discipline de la programmation structurée).
> Either the programmer understands the structured approach to programming, in which case her code will reflect it (whether or not structured control
constructs are available), or the programmer does not, in which case the presence of syntactic constructs is irrelevant.

## Ce qui est en jeu

J'ai constaté que, la plupart du temps, lorsqu'une question d'intelligibilité de code est posée (ou de lisibilité, de maintenabilité, ou encore de code "propre") les avis sont souvent tranchés. Des têtes sont mises à prix sans circonstances atténuantes : les commentaires, les fonctions de plus de N lignes, les langages à typage dynamiques. Nous invoquons pour cela (oui, je fais parfois partie de la foule hostile) des autorités, des ouvrages sacrés, dont la règle devrait être appliquée à la lettre, toujours et partout. Mais l'histoire de l'informatique a des choses à nous apprendre, si nous voulons apprendre.

Nous disposons d'un cas simple. L'instruction `GOTO` a presque disparu, c'est donc qu'on a décidé de d'en passer.
Et ce ne sont pas les échanges entre experts pendant plusieurs dizaines d'années qui nous en a persuadé.
Dans ce cas, sur des débats plus complexes, comme la complexité cyclomatique ou la pertinence de l'orienté-objet, comment espérer avoir des certitudes ?

J'aimerais considérer les différences de style, les désaccords d'implémentations comme une opportunité d'apprendre et de réfléchir plus profondément, et une occasion d'apprendre à travailler ensemble. Dans cette perspective, j'apprécie la démarche d'Alistair Cockburn et son serment de non-allégeance.
> I promise not to exclude from consideration any idea based on its source, but to consider ideas across schools and heritages in order to find the ones that best suit the current situation.

## Ouverture

Lorsqu'un développeur découvre une codebase, il est confronté à du code qui ne lui est pas habituel, où il ne retrouve pas ses repères.
Bien qu'un certain nombre de styles d'écriture soient reconnus et conseillés, [l'état de l'art](https://blog.octo.com/en-finir-avec-la-dette-technique/) de l'équipe qu'il rejoint est différent de celui de l'équipe qu'il quitte. Je pense qu'il est tentant de rejeter cette difficulté sur l'équipe : il est "évident" que le code devrait être écrit d'une certaine manière (la sienne) ; puisqu'il ne l'est pas, c'est que ces membres sont peu rigoureux, ou pas à la page, voire incompétents ou  paresseux. 

Pour contrer cette tendance, ce biais personnel, je pense à l'aphorisme ["Context is everything".](./summary.md)
> Human action can be rendered meaningful only by relating it to the contexts in which it takes place.

Lorsque je suis confronté à un choix d'implémentation qui ne me paraît pas judicieux, je cherche à identifier les contraintes qui s'exerçaient, les compromis qu'a fait l'équipe. Cela ne signifie pas que la solution actuelle soit la meilleure, et appeler à l'inaction. Cela signifie que si je pense que la solution n'est plus la bonne, il me faut identifier les forces en présences et utiliser les bons effets de levier dans le système, plutôt que d'invoquer "le bon sens".

Il existe des techniques spécialement conçues pour partager ce savoir dans l'équipe. 
Je vous propose de suivre deux d'entre elles, les standards de code et les ADR, dans un [deuxième article](../part-2/post.md), où le GOTO refait surface.