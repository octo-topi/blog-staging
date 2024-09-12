# Usual suspects

Cet article est dédié à [Jérémy Buget](https://jbuget.fr/) qui, en créant à Pix un environnement où l'expérimentation et la confiance sont de mise, m'a permis d'apprendre tant de choses - et aujourd'hui de vous en faire profiter.

## tl:dr

Dans une application de gestion, lorsque la base de données relationnelle présente des signes inquiétants (deadlock, I/O en qui monte en flèche), les développeurs ne savent pas toujours comment réagir. Lorsque la base de donnée est administrée en interne par un DBA, c'est vers lui qu'on se tourne. Mais que faire quand on utilise un PaaS ? Le but de cet article est de montrer qu'un développeur peut, avec quelques notions sur le fonctionnement interne des bases de données (ici PostgreSQL) faire un premier diagnostic - et la plupart du temps résoudre le problème. Nous partageons aussi de l'outillage pour le monitoring, sur le serveur web HapiJs et le serveur de BDD dans le PaaS Scalingo.

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

## mardi soir 19: le signe avant-coureur

Si les connexions sont refusées, c'est parce que le nombre de connexions ouvertes a [atteint le quota](https://www.postgresql.org/docs/current/runtime-config-connection.html#GUC-MAX-CONNECTIONS). Comme le nombre de connexions ouvertes est généralement très en dessous du quota, nous pensons tout de suite à une ressource (par exemple une table) qui n'a pas été libérée, et que la plupart des connexions attendent.

Un suspect est rapidement identifié: une mise en production, comportant [une suppression de colonne](https://github.com/1024pix/pix/pull/6983), qui s'est achevée à 17h53.

La mise en production chez Pix est conçue pour minimiser les interruptions de service : les modifications de schéma de base de données sont exécutées [sans arrêter les applications](https://doc.scalingo.com/platform/app/postdeploy-hook#workflow). Dans certains cas, si moins deux tables sont modifiées et qu'un même appel API utilise ces deux tables, [un deadlock](https://stackoverflow.com/questions/22775150/how-to-simulate-deadlock-in-postgresql/22776994#22776994) peut survenir. Cela ne s'est produit qu'une fois, et la solution de contournement a été documentée : arrêter l'API avant d'exécuter la mise en production.

Cette fois-ci, la mise en production est bien finie...mais l'on constate que la requête de suppression de colonne est toujours en attente ! Nous mettons cet incohérence de côté et essayons de faire passer cette requête. Elle attend la libération de la table pour [poser un verrou d'accès exclusif](https://pglocks.org/?pgcommand=ALTER%20TABLE%20DROP%20COLUMN). Il existe une file d'attente sur les locks, aussi cette requête devrait obtenir cet accès exclusif lorsque les requêtes précédentes s'achèvent. Mais force est de constater qu'au bout de 20 minutes, elle ne l'obtiendra pas de sitôt.

Nous décidons d'arrêter tous les conteneurs API pour mettre fin aux requêtes en cours, sans aucun effet. Les requêtes SQL sont toujours actives sur la base de données, alors que les connexions réseau avec les clients ont été perdues ! C'est un comportement [documenté](https://postgrespro.com/list/thread-id/1487997) de PostgreSQL, mais que nous ne connaissions pas. Nous décidons alors de forcer l'arrêt (`pg_terminate`) de toutes les requêtes SQL, dont celle de migration, puis de relancer la mise en production. Ouf, tout se passe bien.

Je profite de cette bonne nouvelle pour vous expliquer pourquoi nous sommes à ce moment-là à près de 15 personnes dans ce Meet. L'objectif chez Pix est que les mises en production soient des non-évènements : les PO décident de les lancer, via Slack, sans aucune assistance de développeur. Par contre, si le monitoring détecte une situation anormale, comme ici sur la BDD, l'équipe [Captains](https://engineering.pix.fr/organisation/2020/04/14/les-capitaines-de-la-production.html) se rend sur le Meet dédié aux incidents de production, ainsi que l'équipe support utilisateur. Il y a un esprit collectif : bien qu'il soit plus confortable de finir sa journée de travail en regardant ailleurs, des développeurs de toutes les équipes et les PO nous ont rejoint. Cela a permis d'explorer plusieurs pistes en parallèle et de communiquer efficacement auprès des utilisateurs.

Bien. Mais que s'est-il passé ? Pourquoi la requête de suppression de colonnes n'a-t-elle pas pu obtenir un accès exclusif ?

## mercredi 20: Batch, (a necessary) evil

Le lendemain, nous cherchons une activité anormale sur la base de données et remarquons deux choses : des imports de fichier XML en échec entre 17h30 et 17h45, et un pic d'activité sur le FS à partir de 17h15. Nous tenons le coupable ! C'est une histoire complexe, mais j'ai le temps de vous l'expliquer.

J'ai effectué la majeure partie de ma carrière professionnelle sur des traitements par lot (batch) en base de données, et le passage aux API a été un changement profond. Pour clarifier tout de suite, ce qui importe dans un batch n'est pas l'aspect "traitement planifié" ([scheduling](https://blog.octo.com/spring-batch-par-quel-bout-le-prendre), cron), mais la quantité de donnée traitée. Les boulangers font des fournées de pain ; ils ne cuisent pas une baguette à la fois. Le lean cherche à réduire la taille des batchs, tout en préservant le cadencement. Le but du batch, c'est de mon point de vue un compromis de performance : il est plus rapide de facturer les consommations téléphoniques mensuelles de tous les clients d'un opérateur, en une fois, en une requête SQL, plutôt que de facturer chaque communication en temps réel.

Dans les API REST, l'objectif est que chaque appel soit rapide, et traite un petit ensemble cohésif de données. Mettre à disposition un endpoint qui accepte une grande quantité de données, ou effectue des actions sur une grande quantité de données, présente des [difficultés](https://jensrantil.github.io/posts/downsides-of-batch-apis/). Dans notre cas, l'import de fichier XML via API est une opération de batch. Elle engendre de nombreuses requêtes SQL, dont certaines sont longues. Ces requêtes longues [ne font pas bon ménage](https://joinhandshake.com/blog/our-team/postgresql-and-lock-queue/) avec une requête de modification de table.

\ > The real root cause of this issue was that we tried to run a migration while there was a long running query on the users table. Long running queries are usually considered a Bad Idea™, and we regularly try to find long running and slow queries and remove them from the application.

Curieusement, cet import de fichier XML nous était déjà bien connu...pour ses problèmes de performance. Avant d'aller plus loin, je fais les présentations. Pix permet au grand public de tester et certifier ses compétences numériques. Chaque utilisateur crée son compte dans l'application et démarre son parcours. Pix adresse aussi un autre public : les élèves de l'éducation nationale. Dans ce cas, chaque classe suit un parcours particulier, prescrit par son professeur. Pour cela, un responsable d'établissement importe dans Pix la liste des élèves, au format XML. La taille de ce fichier XML dépend directement de la taille de l'établissement : il peut atteindre plusieurs dizaines de milliers de lignes. Il serait en théorie possible, à chaque inscription d'un élève dans le SI de l'éducation nationale, de faire un appel API à Pix, mais ce n'est pas la solution en place.

Lors de la mise en place du endpoint d'import, tout se passait bien. Mais après quelque temps, nous avons relevé des erreurs 504, [à l'initiative du routeur](https://doc.scalingo.com/platform/internals/routing#timeouts): le serveur doit commencer à répondre au client en moins de 30 secondes, et lors de fichiers volumineux, le traitement n'avait pas le temps de répondre. Cela a empiré avec des crash OOM de conteneurs applicatifs : nous avons alors décidé [de streamer](https://github.com/1024pix/pix/pull/2061) le traitement. La situation était revenue à la normale. Nous avions envisagé d'isoler le traitement de ces fichiers dans une API dédiée, avec [un mécanisme de queuing](https://github.com/timgit/pg-boss). Cela aurait permis de ne perdre aucun fichier (relance en cas de crash), de fixer le nombre de fichiers à traiter en même temps, d'allouer des ressources adaptées (ex: RAM). Et surtout, en cas de crash, cela n'impacterait pas le service de l'API principale. La contrepartie aurait été des modifications profondes de l'IHM : l'utilisateur aurait besoin de suivre l'avancement de l'import de son fichier. Nous avons décidé d'utiliser ce mécanisme de queuing si le besoin se confirmait, et l'avons d'ailleurs utilisé plus tard [pour des extractions de données](https://github.com/1024pix/pix/blob/2b6b6a12ab70f74e320a239468e441790e7df8ee/docs/adr/0032-utiliser-pgboss-pour-les-taches-asynchrone.md).

Bref, cet import XML était un coupable tout désigné : il générait des requêtes longues. Mais en regardant de plus près sur la période 17h15-17h45, avant la mise en production, nous avons constaté que les requêtes SQL déclenchées par l'import étaient toujours en cours, alors que les appels API avaient échoué en 504. Ces requêtes "fantômes" restaient actives, alors que la réponse ne pourrait plus être fournie à l'utilisateur. Nous avons vu auparavant que si les conteneurs web étaient arrêtés, les requêtes SQL n'étaient pas interrompues. Or ici, le serveur web HapiJs était toujours actif. En regardant les traces sur ce serveur, on voit qu'une fois la requête API traitée, donc après que les requêtes SQl aient abouti et le fichier importé avec succès, le serveur tente de répondre au client via le routeur. Or le socket réseau est fermé : [il répond alors une 499](https://doc.scalingo.com/platform/internals/router-error-codes).

Tout heureux de notre trouvaille brillante, nous observons aussi que plusieurs appels API d'import XML sur le même établissement ont lieu en quelques minutes. Cela veut dire que le même utilisateur soumet le même fichier plusieurs fois. Élémentaire ! Comme le premier import échoue au bout d'une minute sans message d'erreur explicite, il soumet à nouveau le fichier, jusqu'à dix fois, ce qui déclenche autant d'import des mêmes données, qui sont correctement importées. Mais cela, l'utilisateur ne le sait pas. Nous parons au plus pressé : l'équipe en charge de cette fonctionnalité [rajoute un message d'information](https://github.com/1024pix/pix/pull/7111) explicite à l'attention de l'utilisateur : il lui demande d'attendre quelques minutes. Nous créons aussi un dashboard qui liste les imports multiples sur le même établissement, pour que nous puissions interrompre les requêtes SQL. Pour la suite, nous attendons de voir si le nombre de fichiers importés continue à augmenter, auquel cas nous mettrons en place un mécanisme de queuing.

## jeudi 21 : VACUUM, a (necessary) evil

Ce matin-là, nous profitons du calme relatif pour revenir à la santé de la plateforme. Nous remarquons que les VACUUMS sont plus nombreux qu'à l'habitude.

Une idée reçue sur le VACUUM est qu'il récupère de l'espace disque. C'est vrai, mais par qui cet espace a-t-il été consommé, et pourquoi n'est-il plus utile ? Est-ce uniquement les données supprimées par un DELETE SQL ? Ce n'est pas le cas; et pour le comprendre, il faut se pencher sur la manière dont PostgreSQL a implémenté l'intégrité transactionnelle. J'invite les développeurs à lire, dans l'ouvrage ["PostgreSQl internals"](https://postgrespro.com/community/books/internals), la section dédiée, illustrée par de nombreux exemples : "Part 1: Isolation and MVCC / 2.3 Isolation Levels in PostgreSQL". Pour ceux qui n'en ont pas la possibilité, retenez simplement pour cet article que chaque requête de modification (INSERT/UPDATE/DELETE) entraîne la création de nouveaux enregistrements dans la table concernée - même si la transaction a été annulée (ROLLBACK) ! Au bout d'un certain temps, certaines de ces informations ne sont plus visibles de personne (on parle de "dead tuple") et leur emplacement peut être réutilisé.

Chez Pix, nous monitorons les VACUUM car il est arrivé qu'ils impactent significativement les performances de la base de données. Comme le service de BDD fourni par Scalingo ne permet pas de suivre [leur avancement](https://www.postgresql.org/docs/current/progress-reporting.html#VACUUM-PROGRESS-REPORTING) en temps réel (la table `pg_stat_progress_vacuum` n'est pas accessible), nous nous débrouillons autrement. Pour confirmer qu'un VACUUM est en cours, nous vérifions les requêtes en cours via la table `pg_stat_activity` (en SQL ou [via l'IHM Scalingo](https://doc.scalingo.com/databases/postgresql/monitoring#watching-running-queries)). Si celui-ci est fini, nous pouvons consulter l'historique d'exécution (début et fin) dans [les logs de la BDD](https://doc.scalingo.com/platform/app/log-drain) après avoir activé [l'option `log_autovacuum_min_duration`](https://www.postgresql.org/docs/current/runtime-config-logging.html#GUC-LOG-AUTOVACUUM-MIN-DURATION), ainsi que la date de dernière exécution par table dans `pg_stat_user_tables.last_autovacuum`.

Nous remarquons que ce ne sont pas les tables habituelles qui font l'objet d'un VACUUM, mais la table `organization-learners`. Cette table est celle qui est alimentée par l'import de fichier XML. A première vue, si la table est modifiée plus fréquemment sur cette période, alors les VACUUM doivent être plus fréquents. C'est une situation normale.

Nous surveillons également les requêtes SQL longues. Pour disposer de cette information depuis le dashboard, et conserver une trace, [une application dédiée](https://github.com/1024pix/pix-db-stats/blob/36c673e75f9013a495b4abd104847a8382cc4b3d/lib/infrastructure/database-stats-repository.js#L63) interroge la table `pg_stat_activity` pour récupérer les requêtes en cours depuis, par exemple, une minute. Nous remarquons ce jour-là une nouvelle requête, dont les temps d'exécution dépassent 10 minutes à plusieurs reprises.

```sql
UPDATE "organization-learners" SET "isDisabled" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "organizationId" = $2 AND "isDisabled" = FALSE;
```

Cette requête est exécutée lors de l'import du fichier XML, et désactive tous les élèves d'un établissement. Est-il normal que son exécution prenne autant de temps ? La table compte 22 millions de lignes, ce qui est raisonnable, mais ne comporte pas d'index sur les champs de filtre `organizationId` et `isDisabled`. Pour en avoir le cœur net, nous exécutons la requête en production sur le même établissement.

```sql
BEGIN TRANSACTION;

EXPLAIN (ANALYZE, VERBOSE)
UPDATE "organization-learners" (..) WHERE "organizationId" = 1234 (..)

ROLLBACK;
```

Nous constatons tout d'abord que la requête prend moins de 100 ms, et ensuite qu'elle utilise un index partiel sur l'un des champs de filtre (comme quoi, la création d'index ne doit pas être un automatisme). C'est une découverte surprenante : sa durée d'exécution était de 10 minutes. Suspectant une contrainte extérieure, nous exécutons la requête plusieurs fois à intervalles réguliers. C'est bien cela : suivant le moment, elle peut être rapide (< 100 ms) ou lente ( > 1 minute). Nous nous arrêtons alors pour réfléchir : soit la base de données dispose de moins de ressources au moment où la requête s'exécute (CPU, RAM), soit la requête attend l'acquisition d'un verrou sur la table. En inspectant les métriques sur la période où la requête était lente, on voit un pic d'I/O en lecture d'un facteur 10. Comme le traffic HTTP est resté à peu près constant sur cette période, nous consultons les VACUUM : il y en a bien eu un sur cette période.

Nous faisons face à deux possibilités : soit c'est le VACUUM qui bloque cette requête, soit c'est une autre requête. En théorie, il est possible d'exécuter cette requête et d'obtenir les verrous qu'elle sollicite avec le [lock tree](https://wiki.postgresql.org/wiki/Lock_dependency_information#Recursive_View_of_Blocking).

En pratique, une fois revenu de la pause-déjeuner, nous avons choisi une solution plus radicale, mais dont les effets seraient clairs : arrêter le VACUUM automatique sur cette table.

```sql
ALTER TABLE "organization-learners" SET (autovacuum_enabled = false);
```

A la fin de l'après-midi, le constat est sans appel : à traffic constant, il n'y a plus aucun import XML en erreur, et la durée moyenne d'import tombe à 5 secondes. Loin de clarifier la situation, nous faisant maintenant face à un autre problème. Nous pensions que c'était l'afflux de demandes qui causait le problème de performance, mais il semble plutôt que ce sont les conséquences qui causent le problème : les données sont tellement modifiées dans cette table que ce sont les opérations de maintenance (libération de l'espace par VACUUM ) qui entrent en conflit sur l'utilisation des ressources. Même si nous régulons le rythme des imports avec une queue, il nous faudra toujours trouver un moyen d'exécuter les opérations de maintenance.

Deux pistes s'offrent à nous : exécuter le VACUUM sur une période de faible activité (la nuit par exemple), ou l'exécuter plus souvent pour que sa durée soit plus courte et impacte moins l'activité. Le VACUUM est hautement configurable, [notamment sur une table](https://www.postgresql.org/docs/current/sql-createtable.html#SQL-CREATETABLE-STORAGE-PARAMETERS). Mais comment trouver le bon réglage sans impacter le service ? Nous pourrions modifier chaque réglage et observer son résultat en production, ou le faire sur un environnement avec des jeux de données représentatifs, avec des tests automatisés pour créer du traffic. A court terme, aucune des ces deux pistes n'est facile à mettre en oeuvre. Il y a même une autre piste qui permet de réduire la fréquence des VACUUM en diminuant le nombre de dead tuples crées par les UPDATE: le [HOT update](https://www.cybertec-postgresql.com/en/hot-updates-in-postgresql-for-better-performance/). Que faire ?

Nous décidons de réactiver le VACUUM et de reprendre le sujet le lendemain.

## vendredi 22: Eurêka

A notre retour le lendemain, on constate que la nuit n'est pas une période de faible activité: des imports XML sont sortis en erreur cette nuit, et le traffic a repris de plus belle dès 7h. On enlève à nouveau le VACUUM.

Nous reprenons l'analyse du traitement d'import XML en espérant y découvrir quelque chose qui nous aurait échappé. Avec l'équipe qui a développé l'import, nous créons des tests automatisés pour observer si plusieurs imports sur des établissements différent peuvent créer des contentions, si d'autres appels API accédant à cette table sont en cause. Nous commençons à mieux comprendre le traitement, envisageons des restructurations du traitement pour moins solliciter la base de donnés. A vrai dire, nous oscillons entre des sentiments de contrôle en acquérant des connaissances, et de la frustration en constatant qu'aucune solution simple n'apparaît.

C'est alors qu'à 11h52, une nouvelle alerte se déclenche: la base de données est de nouveau injoignable. Nous regardons les requêtes longues, et quelle surprise.

```sql
/* path: /api/campaign-participations */
UPDATE "organization-learners" SET "isDisabled" = FALSE
```

Le silence se fait sur le Meet. Nous sommes incrédules. Une requête qui réécrit toute la table est en cours d'exécution.
Nous consultons les locks : cette requête est active et bloque tous les imports XML en cours.
Un court moment, nous pensons à un développeur qui se serait trompé d'environnement, mais le commentaire en tête de requête indique bien que c'est un appel API. Ceux qui se demandent comment nous avons pu lier requête SQL et endpoint HTTP consulteront avec profit le monkey-patching de [Request](https://github.com/1024pix/pix/blob/8e8e454f2b576d26a6b0dabbb384e2414c307393/api/lib/infrastructure/monitoring-tools.js#L117) dans Hapi et celui de [QueryBuiler.toSQL](https://github.com/1024pix/pix/blob/8e8e454f2b576d26a6b0dabbb384e2414c307393/api/db/knex-database-connection.js#L55) dans Knex.

[Le code correspondant](https://github.com/1024pix/pix/blob/360aab2e4d75fee18840b4ea684d93647ee14533/api/lib/infrastructure/repositories/campaign-participant-repository.js#L42) confirme rapidement cette hypothèse : la PR portant ce bug a été mergée il y a plus de deux mois.

La première réaction est d'arrêter tout de suite la requête, et de bloquer l'accès à la route concernée.
Cela a l'effet attendu : les SQL requêtes en attente sont dépilées, la BDD accepte de nouvelles connexions, et le traffic reprend.

La deuxième réaction est d'inspecter le contenu de la table, dont tous les enregistrements doivent en théorie avoir la valeur FALSE. Nous pensons déjà à restaurer les données depuis un dump, mais surprise : les données sont intactes ! Les valeurs TRUE et FALSE sont réparties de manière valide.

Un soulagement est perceptible chez tous les participants : on passe tout de suite [au bugfix](https://github.com/1024pix/pix/pull/7133), qui se retrouve en production deux heures plus tard. Nous réactivons la route et le VACUUM dans la foulée. Et d'un coup, tout redevient normal. A la fin de la journée, la situation est confirmée : la source du problème était un bug sur une route API, pas un problème de performance.

## La morale de cette histoire ?

\> CHERISH YOUR BUGS. STUDY THEM.

[John Gall, The systems bible](https://x.com/sysquotes/status/1133401845152526341)

Maintenant que la situation est revenue à la normale, nous pouvons souffler un peu, et prendre du recul. Comment faire pour que cette situation ait moins de probabilité de se produire à l'avenir, et si elle se produit, comment limiter son impact ? Je n'aborderai pas le classique post-mortem, qui a bien eu lieu. Abordons d'autres points plus "méta".

### Se mettre en échec, volontairement

Les tests automatisés sont obligatoires chez Pix. Pourtant, aucun test automatisé ne sortait en erreur sur la CI, alors qu'un bug était présent depuis un mois en production. Pourquoi ?

[Le test existant](https://github.com/1024pix/pix/blob/5427dcc3ae2fd55c1e4d17497a01ce8dc8261a75/api/tests/integration/infrastructure/repositories/campaign-participant-repository_test.js#L82) vérifie que la propriété a été mise à jour sur l'enregistrement, mais ne vérifie pas que la propriété n'a pas été modifiée sur les autres enregistrements. D'ailleurs, le cas de test n'utilise qu'un seul enregistrement: le comportement n'était même pas observable. La version corrigée comporte bien [le test manquant](https://github.com/1024pix/pix/blob/36723cf7164a319d84646902b1a0d84283091c74/api/tests/integration/infrastructure/repositories/campaign-participant-repository_test.js#L98).

Cela correspond au pattern [Missing Unit Test](http://xunitpatterns.com/Production%20Bugs.html) de Meszaros. Il écrit que la cause racine est la suivante:  l'équipe est focalisée sur les tests métiers plutôt que sur l'écriture de tests unitaires en TDD. Chez Pix, et dans l'équipe qui a écrit ce code, le TDD est pourtant pratiqué. Alors ? Meszaros ajoute que cela peut aussi se produire lorsque l'équipe fait du TDD, mais s'emballe et écrit du code sans avoir de test unitaire en erreur pour les guider.

Regardons cela de près. TDD est présenté comme une technique qui permet d'obtenir du code "sans bugs". Cela est vrai, mais il y a un pré-requis : une validation par des humains. Les tests ne peuvent pas s'auto-valider. Je connais trois moyens de s'assurer que les tests sont corrects.

Le premier est de vérifier que la règle de gestion vérifiée par le test est correcte, autrement dit : lorsque j'écris mon test (en échec), je vérifie qu'il décrit bien ce que je veux implémenter. Cela peut paraître évident, mais dans certains cas, le besoin métier peut être complexe : l'écriture du test devient un moyen de vérifier ce que nous en avons compris.

Le deuxième est de pratiquer la falsifiabilité : on ne peut pas démontrer que le test est correct en général, mais on peut démontrer qu'il est incorrect sur un cas particulier. Pour trouver ce cas particulier, dès que le test passe, effectuons des mutations dans l'implémentation : modifions-la, puis relançons le test. Si le test continue à passer, alors il ne nous protège pas contre ce comportement. Charge à nous de modifier le test pour qu'il teste réellement ce que nous voulons tester. Lorsqu'il sort à nouveau en erreur, nous pouvons rétablir l'implémentation. Ce genre de test, appelé "test de mutation" peut se faire manuellement lors de l'implémentation ou de la revue de code.

Le troisième est d'ajouter des règles de gestion le plus lentement possible à l'implémentation, en utilisant le pattern "Fake it". En faisant cela, nous sommes obligés d'ajouter des cas de tests pour obtenir l'implémentation finale, ce qui améliore la couverture de chaque cas de test. Une stratégie classique de "Fake it" pour les assertions sur les valeurs de retour est de renvoyer une constante ; pour les assertions sur une source de données, mettre à jour tous les enregistrements au lieu d'un seul. Ce n'est pas si simple de faire semblant : si vous travaillez en pair programming, une personne peut écrire le test et l'autre l'implémentation.

Dans le cas qui nous intéresse ici, le "Fake it" n'a pas été suivi de l'écriture d'un autre test - ou le "Fake it" n'était pas intentionnel. Il a toutefois eu des conséquences inattendues, sur l'ensemble de l'API, parce que l'implémentation est du SQL sur une base de données. En règle générale, il est facile de tester la mise à jour d'un enregistrement, mais [difficile de tester que le reste n'a pas été modifié](https://github.com/GradedJestRisk/web-log/blob/master/Automated-testing-database.md#tables-as-global-variables). Dans notre cas, cela est simple à tester, mais si la requête de mise à jour faisait 200 lignes de long avec des jointures sur plusieurs tables, bon courage !

### S'assurer quand on grimpe

Si vous ne le saviez pas encore, j'aime les linter pour leur capacité à me laisser penser à autre chose qu'aux problèmes triviaux.. ou pour s'assurer que j'y ai effectivement pensé. Ici, une vérification automatisée nous tend les bras: un UPDATE sur un table sans WHERE, voilà qui est suspect. Même mon client de BDD me le demande à l'exécution : are you sure to update all table content ?

Comme nous utilisons la librairie Knex, et qu'un plugin eslint dédié existe, [la route est toute tracée](https://github.com/AntonNiklasson/eslint-plugin-knex/pull/24). Si cette règle avait été active, la CI serait sortie en erreur sur la PR d'origine. Le développeur aurait alors eu pu corriger l'implémentation. Bien sûr, dans les cas où cet usage est souhaité, il peut désactiver cette règle dans ce script uniquement.

### Se souvenir, raconter son histoire

Cet article paraît presque un an après les faits. Je ne fais plus partie de l'équipe Captains et je ne travaille plus pour Pix. D'autres membres de l'équipe sont, eux aussi, partis. Comment faire pour que tout ce que nous avons appris à cette occasion ne soit pas perdu, effacé petit à petit de la mémoire ? Et, plus simplement, si j'étais parti en vacances la semaine suivante et que les mêmes symptômes apparaissaient ?

Nous utilisons chez Pix, pour les évènements qui nous semblent significatifs, [les journaux de bord](https://ut7.fr/blog/2014/11/06/un-outils-pour-les-grands.html). Le principe est simple : écrire sur une nouvelle page, chaque jour, ce qui s'est passé. Comme on ne sait pas à quoi cela va servir, ni où on va, chacun décide de ce qu'il écrira.

Dans l'histoire que je vous ai racontée, nous avons consulté pendant plusieurs jours des dizaines de métriques, des pages de log, consulté beaucoup de documentation. Écrire un journal de bord, c'était choisir de garder tel fait et pas un autre, avoir un dashboard suffisamment parlant pour en faire une copie d'écran, et aussi se dire qu'on pouvait un peu oublier pour libérer de l'espace mental. Écrire ce qu'on a fait, c'était aussi prendre conscience du chemin qu'on avait suivi, et se rendre compte parfois qu'en prenant un raccourci, nous nous étions perdus.

### Se méfier, de soi-même

Je garde le plus évident, mais aussi le plus difficile pour la fin. Ce que je retiens de cette histoire, ce n'est pas que les requêtes SQL continuent à tourner après exécution du client, ni même qu'on a vu une migration de base de données finie et pas finie en même temps ([nous ne saurons jamais pourquoi](https://github.com/1024pix/pix/pull/7182)).

Ce que je retiens, c'est que nous avons passé 3 jours à chercher au même endroit, persuadé que le coupable était notre ennemi juré d'import XML. Même si chaque jour apportait des faits qui contredisaient cette hypothèse, nous avons échafaudé des hypothèses pour prouver que c'était toujours lui. Nous avions déjà décidé depuis le début : il était coupable.

Il nous en a fallu du temps pour détourner le regard, pour chercher ailleurs. Vous souvenez-vous de cette fin d'après-midi, avec ce bug, où vous êtes sûr qu'il est dû à quelque chose tout proche ? Cela fait trois heures que vous vous le dites "Allez, juste cinq minutes de plus", parce que bon cinq minutes ce n'est rien, et vous le sentez, c'est tout prêt. Et puis vous levez les yeux, vous comprenez qu'il n'y a plus personne dans l'open-space, qu'il est passé 19h. Dans votre IDE sont ouverts .. cinquante fichiers ? Avec un peu de malchance, vous arrivez à vous persuader que ce temps n'est pas perdu, et vous continuez : c'est le [sunken cost fallacy](https://thedecisionlab.com/biases/the-sunk-cost-fallacy).

Nous nous sommes entêtés à chercher la cause de ce comportement dans cet import, car "la seule chose qui avait changé, c'était qu'on était à la rentrée". Puisque tout allait bien auparavant, il ne pouvait pas y avoir de bug. Le fait que deux évènements surviennent en même temps nous fait penser que l'un est la cause de l'autre, or.. [corrélation n'est pas causalité](https://en.wikipedia.org/wiki/Correlation_does_not_imply_causation). D'ailleurs, cela ne peut pas être un bug, sinon il se serait déjà produit depuis la dernière mise en production, et nous avons vérifié le changelog. Mais les testeurs savent que pour un bug, pour vivre heureux, il faut vivre caché (allez d'ailleurs voir le "Grand plan to multiply" de [Culture code](https://publication.octo.com/en/download-whitepaper-culture-code)).

Pour faire bonne mesure, je pourrais aussi mentionner [l'effet lampadaire](https://en.wikipedia.org/wiki/Streetlight_effect): nous avons cherché nos clefs sous le lampadaire de l'import XML, parce que là tout est éclairé. Forcément, nous y avons déjà passé tant de temps que c'est un endroit familier, rassurant: nous connaissons presque tous les recoins. Aller ailleurs ? Mais aller où ? Il fait nuit noire.

Les bugs, les problèmes qui nous résistent, nous mettent dans des états inhabituels, pour sûr. Sachant que nos capacités de jugement, bien humaines, sont en plus altérées par le caractère stressant de la situation, ralentissons et regardons autour de nous. Il ne s'agit pas d'explorer frénétiquement toutes les pistes. Il s'agit, de temps en temps, de faire une pause et de se demander: quelle est l'hypothèse que je fais, que je tiens pour sûre, évidente, et qui pourrait expliquer ce comportement si elle était fausse ?

Et maintenant, je vous laisse à votre production !
