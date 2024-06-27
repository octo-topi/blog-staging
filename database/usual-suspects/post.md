# Usual suspects

Cet article est dédié à [Jérémy Buget](https://jbuget.fr/) qui, en créant à Pix un environnement où l'expérimentation et la confiance sont de mise, m'a permis d'apprendre tant de choses - et aujourd'hui de vous en faire profiter.

## tl:dr

Dans une application de gestion, lorsque la base de données relationnelle présente des signes inquiétants (deadlock, I/O en qui monte en flèche), les développeurs ne savent pas toujours comment réagir. Lorsque la base de donnée est administrée en interne par un DBA, c'est vers lui qu'on se tourne. Mais que faire quand on utilise un PaaS ? Le but de cet article est de montrer qu'un développeur peut, avec quelques notions sur le fonctionnement interne des bases de données (ici PostgreSQL) faire un premier diagnostic - et la plupart du temps résoudre le problème.

## Il était une fois

Cet article ne contient ni arbre de décisions ni démarche systématique. Il raconte l'histoire qui nous est arrivée il y a un an, dans l'équipe de développement Pix. Si vous lisez l'article du début à la fin, vous aurez l'impression que plus vous en apprenez, au moins vous en comprenez - et au dénouement vous vous demanderez pourquoi vous n'y avez pas pensé plus tôt. Si vous décidez, en suivant Daniel Pennac, de sauter à la fin de l'histoire, vous serez peut-être déçus par la simplicité de la solution, mais vous pourrez alors continuer par le début et rire sous cape en nous voyant suivre les mauvaises pistes.

Cette histoire est de fait une enquête. Les ressorts classiques du polar s'appliquent : il y a un suspect idéal, mais au fur et à mesure le doute s'installera. OPn suivra de fausses pistes, on retournera en arrière.. et le dénouement sera surprenant. Si vous avez déjà lu d'autres de mes articles, vous savez qu'il y aura des digressions, accompagnées de références pour approfondir. Ah oui, j'oubliais : l'histoire finit bien. Bonne lecture !

## Exposition

Septembre est aux plateformes éducatives, comme Pix, ce que Décembre est aux grands magasins : un mois un peu fébrile où, bien que tout le monde soit habitué aux pics d'activité saisonniers, un imprévu peut vite prendre des proportions significatives. 

En théorie, tout devrait bien se passer :

- côté front, les applications sont des SPA, donc l'IHM est à charge des navigateurs client - les serveurs front sont de simples nginx servant du js;
- côté back, l'API REST est stateless et scalable horizontalement - notre PaaS [Scalingo](https://scalingo.com/) met à disposition un auto-scaler ;
- côté BDD, la seule brique stateful, on utilise un plan PostgreSQL largement taillé. 





A couvrir :

- la Team captains
- les journaux de bord <https://ut7.fr/blog/2014/11/06/un-outils-pour-les-grands.html>
- le batch, c'est mal
  - pourquoi ? <https://jensrantil.github.io/posts/downsides-of-batch-apis/>
  - la PR de stream
- l'espace disque
  - la gestion des transactions PG
  - le VACUUM <https://postgrespro.com/community/books/internals>
- Fake it de TDD et tests de couverture
- le taggage des requêtes SQL avec la route APi avec asyncLocalStorage
- le dashboard Steampipe
- tous comme les biais cognitifs, avec [l'effet lampadaire](https://en.wikipedia.org/wiki/Streetlight_effect). 