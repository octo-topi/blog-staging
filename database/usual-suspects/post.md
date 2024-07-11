# Usual suspects

Cet article est dédié à [Jérémy Buget](https://jbuget.fr/) qui, en créant à Pix un environnement où l'expérimentation et la confiance sont de mise, m'a permis d'apprendre tant de choses - et aujourd'hui de vous en faire profiter.

## tl:dr

Dans une application de gestion, lorsque la base de données relationnelle présente des signes inquiétants (deadlock, I/O en qui monte en flèche), les développeurs ne savent pas toujours comment réagir. Lorsque la base de donnée est administrée en interne par un DBA, c'est vers lui qu'on se tourne. Mais que faire quand on utilise un PaaS ? Le but de cet article est de montrer qu'un développeur peut, avec quelques notions sur le fonctionnement interne des bases de données (ici PostgreSQL) faire un premier diagnostic - et la plupart du temps résoudre le problème.

## Il était une fois

Cet article ne contient ni arbre de décisions ni démarche systématique. Il raconte l'histoire qui nous est arrivée il y a un an, dans l'équipe de développement Pix. Si vous lisez l'article du début à la fin, vous aurez l'impression que plus vous en apprenez, au moins vous en comprenez - et au dénouement vous vous demanderez pourquoi vous n'y avez pas pensé plus tôt. Si vous décidez, en suivant Daniel Pennac, de sauter à la fin de l'histoire, vous serez peut-être déçus par la simplicité de la solution, mais vous pourrez alors continuer par le début et rire sous cape en nous voyant suivre les mauvaises pistes.

Cette histoire est de fait une enquête. Les ressorts classiques du polar s'appliquent : il y a un suspect idéal, mais au fur et à mesure le doute s'installera. Nous suivrons de fausses pistes, on retournera en arrière.. et le dénouement sera surprenant. Si vous avez déjà lu d'autres de mes articles, vous savez qu'il y aura des digressions, accompagnées de références pour approfondir. Ah oui, j'oubliais : l'histoire finit bien. Bonne lecture !

## Exposition

Septembre est aux plateformes éducatives, comme Pix, ce qu'est décembre est aux grands magasins : un mois un peu fébrile où, bien que tout le monde soit habitué aux pics d'activité saisonniers, un imprévu peut vite prendre des proportions significatives. 

En théorie, tout devrait bien se passer :

- côté front, les applications sont des SPA, donc l'IHM est à charge des navigateurs client - les serveurs front sont de simples nginx servant du js;
- côté back, l'API REST est stateless et scalable horizontalement - notre PaaS [Scalingo](https://scalingo.com/) met à disposition un auto-scaler ;
- côté BDD, la seule brique stateful, on utilise un plan PostgreSQL largement taillé. 

Aussi, lorsque la base de données refuse les connexions en une fin d'après-midi de septembre 2023, le mardi 19 à 17h45, les [capitaines](https://engineering.pix.fr/organisation/2020/04/14/les-capitaines-de-la-production.html) dont je fais partie sont intrigués. C'était le premier symptôme d'un problème qui allait durer 3 jours : la base de données allait être régulièrement ralentie au point d'être indisponible. 

Au-delà de ces 3 jours de dégradation de service, ce furent trois jours de travail collectif, OPS et équipes, trois jours d'apprentissage qui nous ont fait progresser dans la mise en place de solutions de mitigations, et de capacité à trouver et résoudre des problèmes en production.

## J-1: Le signe avant-coureur

Si les connexions sont refusées, c'est parce que le nombre de connexions ouvertes a [atteint le quota](https://www.postgresql.org/docs/current/runtime-config-connection.html#GUC-MAX-CONNECTIONS). Comme le nombre de connexions ouvertes est généralement très en dessous du quota, nous pensons tout de suite à une ressource (par exemple une table) qui n'a pas été libérée, et que la plupart des connexions attendent.

Un suspect est rapidement identifié: une mise en production, comportant [une suppression de colonne](https://github.com/1024pix/pix/pull/6983), qui s'est achevée à 17h53.

La mise en production chez Pix est conçue pour minimiser les interruptions de service : les modifications de schéma de base de données sont exécutées [sans arrêter les applications](https://doc.scalingo.com/platform/app/postdeploy-hook#workflow). Dans certains cas, si moins deux tables sont modifiées et qu'un même appel API utilise ces deux tables, [un deadlock](https://stackoverflow.com/questions/22775150/how-to-simulate-deadlock-in-postgresql/22776994#22776994) peut survenir. Cela ne s'est produit qu'une fois, et la solution de contournement a été documentée : arrêter l'API avant d'exécuter la mise en production. 

Cette fois-ci, la mise en production est bien finie...mais l'on constate que la requête de suppression de colonne est toujours en attente ! Nous mettons cet incohérence de côté et essayons de faire passer cette requête. Elle attend la libération de la table pour [poser un verrou d'accès exclusif](https://pglocks.org/?pgcommand=ALTER%20TABLE%20DROP%20COLUMN). Il existe une file d'attente sur les locks, aussi cette requête devrait obtenir cet accès exclusif lorsque les requêtes précédentes s'achèvent. Mais force est de constater qu'au bout de 20 minutes, elle ne l'obtiendra pas de sitôt. 

Nous décidons d'arrêter tous les conteneurs API pour mettre fin aux requêtes en cours, sans aucun effet. Les requêtes SQL sont toujours actives sur la base de données, alors que les connexions réseau avec les clients ont été perdues ! C'est un comportement [documenté](https://postgrespro.com/list/thread-id/1487997) de PostgreSQL, mais que nous ne connaissions pas. Nous décidons alors de forcer l'arrêt (`pg_terminate`) de toutes les requêtes SQL, dont celle de migration, puis de relancer la mise en production. Ouf, tout se passe bien.

Je profite de cette bonne nouvelle pour vous expliquer pourquoi nous sommes à ce moment-là à près de 15 personnes dans ce Meet. L'objectif chez Pix est que les mises en production soient des non-évènements : les PO décident de les lancer, via Slack, sans aucune assistance de développeur. Par contre, si le monitoring détecte une situation anormale, comme ici sur la BDD, l'équipe [Captains](https://engineering.pix.fr/organisation/2020/04/14/les-capitaines-de-la-production.html) se rend sur le Meet dédié aux incidents de production, ainsi que l'équipe support utilisateur. Il y a un esprit collectif : bien qu'il soit plus confortable de finir sa journée de travail en regardant ailleurs, des développeurs de toutes les équipes et les PO nous ont rejoint. Cela a permis d'explorer plusieurs pistes en parallèle et de communiquer efficacement auprès des utilisateurs.

Bien. Mais que s'est-il passé ? Pourquoi la requête de suppression de colonnes n'a-t-elle pas pu obtenir un accès exclusif ?

## J: Batch, (a necessary) evil

Le lendemain, nous cherchons une activité anormale sur la base de données et remarquons deux choses : des imports de fichier XML en échec entre 17h30 et 17h45, et un pic d'activité sur le FS à partir de 17h15. Nous tenons le coupable ! C'est une histoire complexe, mais j'ai le temps de vous l'expliquer.

J'ai effectué la majeure partie de ma carrière professionnelle sur des traitements par lot (batch) en base de données, et le passage aux API a été un changement profond. Pour clarifier tout de suite, ce qui importe dans un batch n'est pas l'aspect "traitement planifié" ([scheduling](https://blog.octo.com/spring-batch-par-quel-bout-le-prendre), cron), mais la quantité de donnée traitée. Les boulangers font des fournées de pain ; ils ne cuisent pas une baguette à la fois. Le lean cherche à réduire la taille des batchs, tout en préservant le cadencement. Le but du batch, c'est de mon point de vue un compromis de performance : il est plus rapide de facturer les consommations téléphoniques mensuelles de tous les clients d'un opérateur, en une fois, en une requête SQL, plutôt que de facturer chaque communication en temps réel.

Dans les API REST, l'objectif est que chaque appel soit rapide, et traite un petit ensemble cohésif de données. Mettre à disposition un endpoint qui accepte une grande quantité de données, ou effectue des actions sur une grande quantité de données, présente des [difficultés](https://jensrantil.github.io/posts/downsides-of-batch-apis/). Dans notre cas, l'import de fichier XML via API est une opération de batch. Elle engendre de nombreuses requêtes SQL, dont certaines sont longues. Ces requêtes longues [ne font pas bon ménage](https://joinhandshake.com/blog/our-team/postgresql-and-lock-queue/) avec une requête de modification de table.

> The real root cause of this issue was that we tried to run a migration while there was a long running query on the users table. Long running queries are usually considered a Bad Idea™, and we regularly try to find long running and slow queries and remove them from the application.

Curieusement, cet import de fichier XML nous était déjà bien connu...pour ses problèmes de performance. Avant d'aller plus loin, je fais les présentations. Pix permet au grand public de tester et certifier ses compétences numériques. Chaque utilisateur crée son compte dans l'application et démarre son parcours. Pix adresse aussi un autre public : les élèves de l'éducation nationale. Dans ce cas, chaque classe suit un parcours particulier, prescrit par son professeur. Pour cela, un responsable d'établissement importe dans Pix la liste des élèves, au format XML. La taille de ce fichier XML dépend directement de la taille de l'établissement : il peut atteindre plusieurs dizaines de milliers de lignes. Il serait en théorie possible, à chaque inscription d'un élève dans le SI de l'éducation nationale, de faire un appel API à Pix, mais ce n'est pas la solution en place.

Lors de la mise en place du endpoint d'import, tout se passait bien. Mais après quelque temps, nous avons relevé des erreurs 504, [à l'initiative du routeur](https://doc.scalingo.com/platform/internals/routing#timeouts): le serveur doit commencer à répondre au client en moins de 30 secondes, et lors de fichiers volumineux, le traitement n'avait pas le temps de répondre. Cela a empiré avec des crash OOM de conteneurs applicatifs : nous avons alors décidé [de streamer](https://github.com/1024pix/pix/pull/2061) le traitement. La situation était revenue à la normale. Nous avions envisagé d'isoler le traitement de ces fichiers dans une API dédiée, avec [un mécanisme de queuing](https://github.com/timgit/pg-boss). Cela aurait permis de ne perdre aucun fichier (relance en cas de crash), de fixer le nombre de fichiers à traiter en même temps, d'allouer des ressources adaptées (ex: RAM). Et surtout, en cas de crash, cela n'impacterait pas le service de l'API principale. La contrepartie aurait été des modifications profondes de l'IHM : l'utilisateur aurait besoin de suivre l'avancement de l'import de son fichier. Nous avons décidé d'utiliser ce mécanisme de queuing si le besoin se confirmait, et l'avons d'ailleurs utilisé plus tard [pour des extractions de données](https://github.com/1024pix/pix/blob/2b6b6a12ab70f74e320a239468e441790e7df8ee/docs/adr/0032-utiliser-pgboss-pour-les-taches-asynchrone.md).

Bref, cet import XML était un coupable tout désigné : il générait des requêtes longues. Mais en regardant de plus près sur la période 17h15-17h45, avant la mise en production, nous avons constaté que les requêtes SQL déclenchées par l'import étaient toujours en cours, alors que les appels API avaient échoué en 504. Ces requêtes "fantômes" restaient actives, alors que la réponse ne pourrait plus être fournie à l'utilisateur. Nous avons vu auparavant que si les conteneurs web étaient arrêtés, les requêtes SQL n'étaient pas interrompues. Or ici, le serveur web HapiJs était toujours actif. En regardant les traces sur ce serveur, on voit qu'une fois la requête API traitée, donc après que les requêtes SQl aient abouti et le fichier importé avec succès, le serveur tente de répondre au client via le routeur. Or le socket réseau est fermé : [il répond alors une 499](**https://doc.scalingo.com/platform/internals/router-error-codes).

Tout heureux de notre trouvaille brillante, nous observons aussi que plusieurs appels API d'import XML sur le même établissement ont lieu en quelques minutes. Cela veut dire que le même utilisateur soumet le même fichier plusieurs fois. Élémentaire ! Comme le premier import échoue au bout d'une minute sans message d'erreur explicite, il soumet à nouveau le fichier, jusqu'à dix fois, ce qui déclenche autant d'import des mêmes données, qui sont correctement importées. Mais cela, l'utilisateur ne le sait pas. Nous parons au plus pressé : l'équipe en charge de cette fonctionnalité [rajoute un message d'information](https://github.com/1024pix/pix/pull/7111) explicite à l'attention de l'utilisateur : il lui demande d'attendre quelques minutes. Nous créons aussi un dashboard qui liste les imports multiples sur le même établissement, pour que nous puissions interrompre les requêtes SQL. Pour la suite, nous attendons de voir si le nombre de fichiers importés continue à augmenter, auquel cas nous mettrons en place un mécanisme de queuing.

## J+1 : VACUUM



- les journaux de bord <https://ut7.fr/blog/2014/11/06/un-outils-pour-les-grands.html>
- l'espace disque
  - la gestion des transactions PG
  - le VACUUM <https://postgrespro.com/community/books/internals>
- Fake it de TDD et tests de couverture
- le taggage des requêtes SQL avec la route APi avec asyncLocalStorage
- le dashboard Steampipe
- tous comme les biais cognitifs, avec [l'effet lampadaire](https://en.wikipedia.org/wiki/Streetlight_effect). 