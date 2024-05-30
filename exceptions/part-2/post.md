# Les exceptions ou le retour du GOTO

## Faire ou ne pas faire exception ?

Dans [l'article précédent](https://blog.octo.com/considered-harmful), nous avons vu que les débats sur le style d'implémentation ne datent pas d'hier. Selon [Steve McConnell](https://github.com/octo-topi/blog-staging/blob/add-exceptions-part-two/exceptions/part-2/assets/excerpts.md#code-complete), le débat sur le GOTO est toujours d'actualité.

\> Vous pensez probablement que le débat sur le GOTO appartient au passé (...) mais le GOTO est toujours en bonne santé, il vit au plus profond des serveurs de votre entreprise. Les débats autour du GOTO fleurissent toujours avec des costumes différents, par exemple les multiples retours dans la même fonction, la présence de plusieurs sorties d'une boucle et la gestion des erreurs.

La plupart des développeurs ont un avis arrêté sur la gestion des erreurs. Ils choisissent l'une des deux options suivantes :

- lever une exception (throw - try - catch);
- renvoyer un code de retour.

En ce qui me concerne, je réponds "Ça dépend (du contexte)". Lorsqu'une équipe prend une décision d'implémentation, elle ne choisit pas la meilleure solution "en général", mais une solution adaptée à son contexte, à un instant donné.

Cet article compare les deux solutions théoriques, puis présente un cas pratique pour chacune d'elles. Il expose également deux moyens pour expliciter les raisons de son choix : un [ADR](https://github.com/1024pix/pix/blob/dev/docs/adr/0001-enregistrer-les-decisions-concernant-l-architecture.md) et un standard de code, sous forme de linter. Ainsi, si le contexte change, la solution peut être revue en connaissance de cause.

## Ce qu'en dit la littérature

### Utiliser parfois des exceptions

En 1993, dans le chapitre "Defensive programing" de "Code complete", McConnell apparente le concept d'exception au `GOTO`. Pour rappel, l'invocation du `GOTO` permet de "sauter" (transférer directement le contrôle) vers n'importe quelle ligne du fichier : en avant, en arrière... C'est une fonctionnalité assez puissante. Assez puissante aussi pour rendre le code difficile à comprendre. Alors que l'attention du développeur est généralement restreinte à une portion de code (ex : la fonction en cours d'exécution), avec le `GOTO` on peut se télétransporter n'importe où dans le fichier.

Lorsqu'une exception survient, le contrôle n'est pas transféré n'importe où dans le fichier. Il est transféré plus haut dans la pile d'appel, voir au processus appelant. Là où la portée du `GOTO` se limitait au fichier, la portée de l'exception est le processus de l'OS.

S'il ne fallait en retenir qu'une phrase [du chapitre](https://github.com/octo-topi/blog-staging/blob/add-exceptions-part-two/exceptions/part-2/assets/excerpts.md#code-complete), ce serait celle-ci :

\> Utilisées judicieusement, elles peuvent réduire la complexité. Utilisées imprudemment, elles peuvent rendre le code quasi-impossible à suivre.

McConnell attire l'attention sur le fait que, face à une erreur, on peut :

- favoriser l'intégrité et arrêter totalement l'application (ex : sur un dispositif d'irradiation médical, l'interception d'une exception cause l'arrêt de l'appareil) ;
- favoriser la robustesse et continuer comme si de rien n'était (ex : dans l'affichage d'un traitement de texte, l'interception d'une exception mineure ne provoque pas d'arrêt, elle est ignorée).

La gestion des erreurs est donc une exigence fonctionnelle. McConnell liste sur une dizaine de pages [des critères précis](https://github.com/octo-topi/blog-staging/blob/add-exceptions-part-two/exceptions/part-2/assets/excerpts.md#code-complete) pour utiliser judicieusement les exceptions.

### Utiliser souvent des exceptions

2008 voit la publication par Robert Martin du livre le plus connu aujourd'hui sur la lisibilité du code : "Clean code". Dans [le chapitre consacré à la gestion d'erreur](https://github.com/octo-topi/blog-staging/blob/add-exceptions-part-two/exceptions/part-2/assets/excerpts.md#clean-code), Michael Feathers conseille l'utilisation des exceptions au lieu des codes de retour. Son intention est de mettre en avant le comportement nominal, et de mettre de côté le comportement exceptionnel (erreur).

\> La gestion des erreurs est importante, mais si elle obscurcit la logique (métier), c'est une mauvaise chose. (..) Nous pouvons écrire du code propre et robuste si nous envisageons la gestion d'erreur comme une préoccupation séparée, quelque chose d'indépendant de la logique principale.

### Utiliser rarement des exceptions

Plus récemment (2018), dans "How Javascript works", Crockford est [très critique](https://github.com/octo-topi/blog-staging/blob/add-exceptions-part-two/exceptions/part-2/assets/excerpts.md#how-javascript-works) envers l'usage actuel des exceptions. Dans le même style radical que dans "The Good Parts", il explique que les exceptions ont été détournées de leur but initial, la gestion des erreurs, pour être utilisées comme n'importe quelle structure de contrôle. Il prescrit d'utiliser des codes de retour dans la plupart des cas, et de garder les exceptions pour les seuls cas "désespérés".

\> Raisonner sur la récupération en cas d'erreur est difficile. Nous devrions utiliser une solution simple et fiable. Renvoyez dans les valeurs de retours ce à quoi vous vous attendez. Gardez les exceptions pour les exceptions.

### Erreur, vous avez dit erreur ?

Avant de passer au cas pratique, de découvrir quelle est la bonne solution parmi ces trois livres, faisons un point de vocabulaire : qu'entendons-nous par exception ?

Tous les développeurs connaissent le mot-clef `exception` présent dans la plupart des langages de programmation, et l'utilisent aussi pour désigner des situations "inattendues". Les auteurs ci-dessus insistent sur la notion d'erreur : toutes les erreurs (rencontrées par le processus au runtime) ne lèvent pas des `exception` (dans le langage). Pour clarifier ce point, je propose de reprendre les types de cas d'utilisation (use-case) en UML : nominal, alternatif, exceptionnel.

Tout le monde est à peu près d'accord sur ce qu'est un cas nominal, c'est quand tout va bien. Par contre, ce qui distingue un cas alternatif et un cas exceptionnel est trop souvent une affaire de goût personnel. Crockford dit que, dans le cas d'un programme qui lit un fichier, le fait que le fichier n'existe pas n'est pas un cas exceptionnel, mais un cas alternatif. Et vous ?

Si les développeurs se mettaient d'accord, de préférence avec l'avis du métier, sur ce qui constitue un cas exceptionnel, le code aurait plus de chances d'être lisible. En effet, si l'on suit l'avis de Michael Feathers, les cas nominaux et alternatifs doivent constituer le corps du programme (`the main logic`). Si une grande partie du code comporte des `exception`, ce n'est pas pour gérer des cas exceptionnels, mais des cas alternatifs. Le traitement de ces cas alternatifs doit être réintégré au code principal sous forme de codes de retour. Vous suivez ?

C'est un peu comme le principe : "Si tout est important, rien n'est important". Les cas exceptionnels sont exceptionnels parce qu'ils sont peu nombreux, n'arrivent pas souvent. La plupart du temps, on suit la règle. S'ils arrivent souvent, ils ne font plus exception - ils deviennent partie de la règle.

## En pratique : deux exemples

Assez parlé, voyons des cas pratiques. Ils sont tirés de l'API REST en NodeJs de l'application Pix. Elle est accessible au grand public, aussi bien l'[application](https://app.pix.fr) en elle-même que [son code source](https://github.com/1024pix/pix). En ligne depuis 8 ans, utilisée par des millions d'utilisateurs et développée par 50 développeurs répartis dans plusieurs équipes, c'est un cas représentatif.

Les cas pratiques couvrent deux implémentations possibles :

- lever une exception ;
- renvoyer une valeur de retour.

Ils ont été implémentés à des moments différents de ma participation au projet :

- bien avant que je rejoigne le projet ;
- pendant que j'y participais.

Nous essaierons de savoir à quelle règle théorique se rattachent ces cas.

Nous verrons aussi comment nous pourrions matérialiser les raisons de ce choix :

- écrire des [ADR](https://github.com/1024pix/pix/blob/656e609745d36ead5b33695da6c5272c04bb9272/docs/adr/0001-enregistrer-les-decisions-concernant-l-architecture.md);
- les incorporer à un standard de code, implémenté sous forme de linter.

Ainsi, les nouveaux venus peuvent s'approprier ces décisions. Et si le contexte change, la solution peut être revue en connaissance de cause.

### Cas 1 : Lever une exception dans les use-case

#### Implémentation

Lors du traitement d'une requête API, le scénario nominal est le suivant :

- l'utilisateur a les droits d'effectuer cet appel ;
- les données fournies par l'utilisateur sont valides ;
- les données existantes sont compatibles avec la demande effectuée par l'utilisateur.

Sur Pix, le corps principal du traitement (en général, le use-case) effectue ces vérifications. Si l'une d'elles échoue, il initie une exception. L'API répond alors à l'utilisateur par un code 4xx.

Prenons l'exemple de l'ajout d'un administrateur depuis une IHM d'administration, via un `POST` de la route `/api/admin/admin-members`. Si plusieurs utilisateurs ajoutent un administrateur depuis l'IHM sur un temps court, on recevra des demandes identiques : la première sera honorée et on renvoie une 201 (Created), les autres seront rejetés avec une 422 (UnprocessableEntityError). J'utilise l'expression "temps court" pour simplifier : tant que le front-end (SPA Ember) n'est pas notifié de la modification de la donnée dans l'API, il permet l'ajout d'un administrateur ; et en l'absence de Websockets, cela ne se produit que lorsque l'utilisateur rafraîchit la page.

Comment l'API peut-elle répondre un code 422 lorsque le use-case lève une exception ?$

Il n'y a pas moins de 7 étapes, aussi je les détaille avant de citer le code :

- A - au démarrage du serveur, un hook de pre-response est enregistré ;
- B - la requête est reçue par le controller et transmise au use-case ;
- C - le use-case lève une exception ;
- le framework HapiJs intercepte l'exception et l'encapsule dans une réponse HTTP ;
- le hook est appellé (sur cette réponse et toutes les autres) ;
- D - sur cette réponse, le hook détecte qu'une exception a eu lieu ;
- E - il appelle une fonction de mapping, qui en fonction de l'exception renvoie une réponse personnalisée (ici une 422).

A - Enregistrement du hook

```javascript
server.ext('onPreResponse', preResponseUtils.handleDomainAndHttpErrors);
```

[source](https://github.com/1024pix/pix/blob/b6835d9c6ed8e7738a270d84786e86f9159c2319/api/config/server-setup-error-handling.js#L30)

B - Controller

````javascript
  const attributes = await adminMemberSerializer.deserialize(request.payload);
  const savedAdminMember = await usecases.saveAdminMember(attributes);
  return h.response(dependencies.adminMemberSerializer.serialize(savedAdminMember)).created();
````

[source](https://github.com/1024pix/pix/blob/850441bd9378e3df035cfc2133f33da9d267b8bc/api/lib/application/admin-members/admin-member-controller.js#L30)

C - Use-case

```javascript
const saveAdminMember = async function () {
    if(memberExists) {
        throw new AlreadyExistingAdminMemberError();
    }
}
```

[source](https://github.com/1024pix/pix/blob/850441bd9378e3df035cfc2133f33da9d267b8bc/api/lib/domain/usecases/save-admin-member.js#L22)

Erreur

```javascript
class AlreadyExistingAdminMemberError extends DomainError {
  constructor(message = 'Cet agent a déjà accès') {
    super(message);
  }
}
```

[source](https://github.com/1024pix/pix/blob/4e035ce1c9b58db20a5efd00c634f4ed2339afbd/api/lib/domain/errors.js#L18-L18)

D - Interception de la réponse dans le hook

```javascript
function handleDomainAndHttpErrors( request, errorManager) {
  const response = request.response;
  if (response instanceof DomainError) {
    return errorManager.handle(request, response);
  }
}
```

[source](https://github.com/1024pix/pix/blob/3ba616d8f47e16202533fc6da2536d9b27f1d57a/api/lib/application/pre-response-utils.js#L14)

E - Mapping de l'exception vers une réponse 422

```javascript
function handle(error) {
    if (error instanceof DomainErrors.AlreadyExistingAdminMemberError) {
        return new HttpErrors.UnprocessableEntityError(error.message);
    }
}
```

[source](https://github.com/1024pix/pix/blob/dev/api/lib/application/error-manager.js#L349-L351)

Il existe cependant des cas où les règles de gestion ne sont pas implémentées dans le use-case : les exceptions levées sont interceptées par l'appelant, comme dans le cas ci-dessous.

```javascript
  return dependencies.assessmentRepository.getByAssessmentIdAndUserId(assessmentId, userId).catch(() => {
    const buildError = _handleWhenInvalidAuthorization('Vous n’êtes pas autorisé à accéder à cette évaluation');
    return h.response(dependencies.validationErrorSerializer.serialize(buildError)).code(401).takeover();
  });
```

[source](https://github.com/1024pix/pix/blob/1acf7dfc227d7ce45e5fc02487c84e88c0c587ed/api/lib/application/preHandlers/assessment-authorization.js#L14)

J'en profite pour évoquer une solution alternative pour que l'appelant puisse gérer un scénario exceptionnel. En programmation fonctionnelle, il existe le pattern `Either` qui permet de gérer des exceptions sans transférer le contrôle : en voilà un exemple [ici](
https://blog.logrocket.com/javascript-either-monad-error-handling/).

#### Réflexion

Cette solution était déjà en place lorsque je suis arrivé sur le projet, et cela me semblait relever de la magie. En effet, le framework effectue deux actions que l'on ne voit pas dans le use-case : intercepter l'exception, et inspecter toutes les réponses avant de les renvoyer à l'utilisateur. En contraste, voilà une solution explicite dans le use-case ci-dessous. Elle a le désavantage d'exposer dans le domaine des notions de la couche d'infrastructure (HTTP), une autre solution serait de le faire dans le controller.

```javascript
const saveAdminMember = async function () {
    if(memberExists) {
        return h.response("Cet agent a déjà accès").code(201)
    }
}
```

Comme les raisons du choix de cette solution ne sont pas documentés, et que la connaissance ne s'est pas transmise oralement, j'avance des hypothèses :

- le fait que l'utilisateur soit déjà administrateur est un scénario exceptionnel ;
- une exception est levée pour extraire du use-case et du controller la gestion de ce scénario exceptionnel ;
- le use-case retourne toujours des données nominales ;
- le controller n'a pas à inspecter la valeur de retour du use-case : il ne fait que sérialiser les données en JSON ;

Si ces hypothèses sont correctes, cet exemple met avant le couplage évoqué par la littérature : le use-case se comporte de cette façon parce qu'un autre composant, à plusieurs couches de là, impose ce contrat de communication. Comme le dit "The pragmatic programmer" :
> These programs break encapsulation: routines and their callers are more tightly coupled via exception handling.

Dans les faits, cette solution est utilisée presque partout et par toutes les équipes chez Pix.
Elle est testée unitairement :

- levée de l'exception par le use-case [source](https://github.com/1024pix/pix/blob/850441bd9378e3df035cfc2133f33da9d267b8bc/api/tests/unit/domain/usecases/save-admin-member_test.js#L76-L76) ;
- mapping de l'exception en réponse HTTP [source](https://github.com/1024pix/pix/blob/b6835d9c6ed8e7738a270d84786e86f9159c2319/api/tests/unit/application/pre-response-utils_test.js#L33).

Mon avis personnel est le suivant : l'utilisation de cette solution technique, passé les premiers jours, est simple. Cependant, la problématique la plus importante n'est pas adressée, car elle se situe en dehors du code : qui décide qu'un scénario métier est alternatif ou exceptionnel ? Comme aucune pratique organisationnelle ne traite le sujet, il est tentant de gérer les scénarios alternatifs en levant des exceptions, et donc de perdre toute distinction.

#### Matérialisation

Si personne ne sait pourquoi ce choix a été fait, il est toujours possible de noter nos hypothèses sous forme de rétro-ADR. Au fur et à mesure, on acquiert de plus en plus de connaissances ; et si l'on décide de changer de solution, on le fait en connaissance de cause.

Lorsque je suis arrivé chez Pix, je pensais que cette solution gérait les cas alternatifs et j'avais écrit [cet ADR](https://github.com/GradedJestRisk/pix-tools/blob/e0478debe0d5454fe75844e4997fe279bac91d92/adr/handle-alternative-scenario.md). Avec le temps, mes hypothèses ont changé.

J'ai aussi pensé à ajouter une règle de lint qui autorise explicitement à lever les erreurs qui héritent de `Domain` dans les use-case, et l'interdire ailleurs. Ainsi, on incite à garder les règles de gestion dans les use-case. Le développeur qui lève une erreur de type `Domain` dans un repository pourra choisir de retourner à la place une valeur de retour, ou à ajouter une exception.

### Cas 2 : Retourner une valeur si un appel HTTP échoue

Lorsqu'une API externe est appelée, par exemple celle de Pôle Emploi pour le SSO, on s'attend à ce qu'elle ne soit pas toujours disponible, ou qu'elle nous renvoie de temps en temps des erreurs (code 4**). Si nous suivons les préconisations de Martin Fowler, la fonction devrait renvoyer une valeur de retour plutôt que de lever une exception. C'est ce qui est fait.

#### Implémentation

Voilà la séquence des évènements :

- A : on appelle l'API externe avec de la librairie HTTP axios ;
- si l'appel ne s'achève pas avec succès, une exception est levée par la librairie ;
- on catche cette erreur de suite et on récupère le code retour HTTP et les détails de l'erreur ;
- avec ceux-ci, on alimente une valeur de retour dans un objet de type `HttpResponse` ;
- on renvoie cette valeur de retour ;
- B : l'appelant inspecte la valeur de retour et prend les décisions associées.

A - Appel API externe

```javascript
try{
    const httpResponse = await axios.post(url, config);
} catch (httpErr) {
    if (httpErr.response) {
        code = httpErr.response.status;
        data = httpErr.response.data;
    } else {
        code = '500';
        data = null;
    }

    return new HttpResponse({
        code,
        data,
        isSuccessful,
    });
    
}
```

[source](https://github.com/1024pix/pix/blob/2a8a3cc7b38621fdb35ff81f7f6e6675e8d31cd0/api/lib/infrastructure/http/http-agent.js#L59)

B - L'appelant interprète le retour

```javascript
  const { code, isSuccessful } = await httpAgent.post({ url, payload: event, headers });

  if (!isSuccessful) {
    throw new AuditLoggerApiError(`Pix Audit Logger Api answered with status ${code}`);
  }
```

[source](https://github.com/1024pix/pix/blob/6a8aaef6c171cfdef5bdd764ce51cc2aa24da6cd/api/lib/infrastructure/repositories/audit-logger-repository.js#L14)

#### Réflexion

Cette solution a été mise en place lorsque je faisais partie de l'équipe. L'utilisation de ce module m'avait semblé inhabituelle au début, mais lorsque je me suis rendu compte du nombre de cas à gérer lors de l'appel à axios, j'ai trouvé que la valeur de retour du module, un objet Response, simplifiait la compréhension.

Si l'on revient sur la différence entre scénario alternatif et exceptionnel, on pourrait se demander si un appel HTTP échoue souvent ou exceptionnellement. Dans notre contexte, on appelle des API externe sans SLA : partons du principe qu'elles peuvent échouer.

#### Matérialisation

Comme il y a peu d'appels à des API externes, les développeurs ne pouvaient pas savoir que cette décision avait été prise, et auraient implémenté les appels de manière différente.

Pour que cette solution soit utilisée sans effort, on a encapsulé la librairie dans un module, puis :

- empêché l'appel direct à la librairie avec [une règle de lint](https://github.com/1024pix/pix/blob/f379a4f381c983ab7fe1f0f495b97fdf91eddbdc/api/lib/.eslintrc.js#L8)
- qui renvoie au module et aux raisons de son choix dans un [ADR](https://github.com/1024pix/pix/blob/701407fd8694666b6bb9042eb15bdef42b2a135f/docs/adr/0024-encapsuler-appel-http.md) qui explicite les raisons de ce choix.

## Conclusion

Nous avons vu que le quotidien du développeur est rempli de micro-décisions de design, dont font partie l'usage des exceptions. Ces décisions sont prises à partir de ses compétences générales, transposables dans ses expériences professionnelles successives, adaptées au contexte de sa mission actuelle.

Pour prendre les meilleures décisions, un dialogue doit tout d'abord avoir lieu au sein de l'équipe. Une fois la solution décidée, elle doit être vérifiée par des tests automatiques, par exemple des linter.

Finalement, pour que cette connaissance ne soit pas perdue, et que la solution puisse être reconsidérée, une documentation doit être produite. Pix a choisi, pour éviter le phénomène bien connu de [documentation inadaptée](https://blog.octo.com/le-jour-ou-la-documentation-a-disparu), de le documenter sous forme [d'ADR](https://blog.octo.com/architecture-decision-record). Même si la connaissance a été perdue, il n'est jamais trop tard : écrivez des rétro-ADR pour matérialiser vos connaissances existantes.

Certains d'entre-vous auront reconnu le principe de partage en continu des connaissances, ou "Documentation vivante", de [Cyrille Martraire](https://github.com/cyriux). Et maintenant, GOTO practice !
