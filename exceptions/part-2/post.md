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

Plus récemment (2018), dans "How Javascript works", Crockford est [très critique](https://github.com/octo-topi/blog-staging/blob/add-exceptions-part-two/exceptions/part-2/assets/excerpts.md#how-javascript-works) envers l'usage actuel des exceptions. Dans le même style radical que dans "The Good Parts", il explique que les exceptions ont été détournées de leur but initial, la gestion des erreurs, pour être utilisée comme n'importe quelle structure de contrôle. Il prescrit d'utiliser des codes de retour dans la plupart des cas, et de garder les exceptions pour les seuls cas "désespérés".

\> Raisonner sur la récupération en cas d'erreur est difficile. Nous devrions utiliser une solution simple et fiable. Renvoyez dans les valeurs de retours ce à quoi vous vous attendez. Gardez les exceptions pour les exceptions.

### Erreur, vous avez dit erreur ?

Avant de passer au cas pratique, de découvrir quelle est la bonne solution parmi ces trois livres, faisons un point de vocabulaire : qu'entendons-nous par exception ?

Tous les développeurs connaissent le mot-clef `exception` présent dans la plupart des langages de programmation, et l'utilisent aussi pour désigner des situations "inattendues". Les auteurs ci-dessus insistent sur la notion d'erreur : toutes les erreurs (rencontrées par le processus au runtime) ne lèvent pas des `exception` (dans le langage). Pour clarifier ce point, je propose de reprendre les types de cas d'utilisation (use-case) en UML : nominal, alternatif, exceptionnel. 

Tout le monde est à peu près d'accord sur ce qu'est un cas nominal, c'est quand tout va bien. Par contre, ce qui distingue un cas alternatif et un cas exceptionnel est trop souvent une affaire de goût personnel. Crockford dit que, dans le cas d'un programme qui lit un fichier, le fait que le fichier n'existe pas n'est pas un cas exceptionnel, mais un cas alternatif. Et vous ?

Si les développeurs se mettaient d'accord, de préférence avec l'avis du métier, sur ce qui constitue un cas exceptionnel, le code aurait plus de chances d'être lisible. En effet, si l'on suit l'avis de Michael Feathers, les cas nominaux et alternatifs doivent constituer le corps du programme (`the main logic`). Si une grande partie du code comporte des `exception`, ce n'est pas pour gérer des cas exceptionnels, mais des cas alternatifs. Le traitement de ces cas alternatifs doit être réintégré au code principal sous forme de codes de retour. Vous suivez ? 

C'est un peu comme le principe : "Si tout est important, rien n'est important". Les cas exceptionnels sont exceptionnels parce qu'ils sont peu nombreux, parce qu'ils n'arrivent pas souvent, parce qu'en général on suit la règle. S'ils arrivent trop souvent, ils deviennent partie de la règle et ne font plus exception.

## La règle et ses exceptions : deux exemples

Assez parlé, voyons des cas pratiques. Ils sont tirés de l'API REST en NodeJs de l'application Pix. Elle est accessible au grand public, aussi bien l'[application](https://github.com/1024pix/pix) en elle-même que [son code source](https://github.com/1024pix/pix). En ligne depuis 8 ans, utilisée par des millions d'utilisateurs et développée par 50 développeurs répartis dans plusieurs équipes, c'est un cas représentatif.

Les deux cas pratiques concernent les scénarios alternatifs, c'est à dire qu'on s'attend à ce qu'ils se produisent lors du fonctionnement normal de l'application :

- le premier cas concerne les scénarios alternatifs dans les use-case (architecture de type Clean architecture);
- le deuxième cas concerne l'appel d'API externes en erreur.

Si l'on suit Martin Fowler et Douglas Crockford, nous utiliserions des valeurs de retour, pas des exceptions. Quel choix a été fait ? Les deux, mon capitaine !

- pour le premier cas, on utilise des exceptions ;
- pour le deuxième cas, on utilise des valeurs de retour.

Voyons pourquoi, et aussi comment matérialiser les raisons de ce choix.

### Cas 1: Scénario alternatif dans les use-cases - lever une exception

Lors du traitement d'une requête API, un chemin nominal est attendu :

- l'utilisateur a les droits d'effectuer cet appel ;
- les données fournies par l'utilisateur sont valides ;
- les données existantes sont compatibles avec la demande effectuée par l'utilisateur.

Le corps principal du traitement effectue ces vérifications, mais si l'une d'elles échoue, il initie une exception.
Prenons l'exemple de l'ajout d'un administrateur depuis une IHM d'administration, sur un `POST` de la route `/api/admin/admin-members`.
Plusieurs demandes identiques peuvent être envoyées depuis l'IHM d'administration, par exemple si plusieurs utilisateurs effectuent la même demande en même temps. Ce n'est pas un scénario nominal, mais rien d'exceptionnel non plus : on signale à l'utilisateur que sa demande ne peut aboutir, avec une réponse `UnprocessableEntityError` (422). 

Le use-case est appelé par un contrôleur HTTP, lui-même appelé par le routeur du framework, HapiJs. Si nous suivons les préconisations de Martin Fowler, le use-case devrait renvoyer une valeur de retour au contrôleur, qui se chargerait de répondre une 422. Mais on observe, à la place, que le use-case lève une exception, normalement réservée aux scénarios exceptionnels. Pourquoi ?

```javascript

throw new AlreadyExistingAdminMemberError();
```

[source](https://github.com/1024pix/pix/blob/850441bd9378e3df035cfc2133f33da9d267b8bc/api/lib/domain/usecases/save-admin-member.js#L22)


```javascript

```

[source](https://github.com/1024pix/pix/blob/4e035ce1c9b58db20a5efd00c634f4ed2339afbd/api/lib/domain/errors.js#L18-L18)

Parce que la solution nous a semblé plus concise et plus fiable : un hook général du routeur du framework intercepte l'exception, et la transforme en réponse HTTP 422.

```javascript
server.ext('onPreResponse', preResponseUtils.handleDomainAndHttpErrors);
```

[source](https://github.com/1024pix/pix/blob/b6835d9c6ed8e7738a270d84786e86f9159c2319/api/config/server-setup-error-handling.js#L30)

```javascript
function handleDomainAndHttpErrors( request, errorManager) {
  const response = request.response;
  if (response instanceof DomainError) {
    return errorManager.handle(request, response);
  }
}
```

[source](https://github.com/1024pix/pix/blob/3ba616d8f47e16202533fc6da2536d9b27f1d57a/api/lib/application/pre-response-utils.js#L14)

```javascript
function handle(error) {
    if (error instanceof DomainErrors.AlreadyExistingAdminMemberError) {
        return new HttpErrors.UnprocessableEntityError(error.message);
    }
}
```

[source](https://github.com/1024pix/pix/blob/dev/api/lib/application/error-manager.js#L349-L351)

Ce compromis fonctionne bien, car toutes les équipes ont la même définition de ce qu'est un scénario alternatif, et que la même solution est appliquée sur tous les use-case. Les exceptions sont déclarées dans un dossier dédié et gérée par un code générique. Le fait que le use-case lève une exception [est testé unitairement](https://github.com/1024pix/pix/blob/850441bd9378e3df035cfc2133f33da9d267b8bc/api/tests/unit/domain/usecases/save-admin-member_test.js#L76-L76), tout comme [le code](https://github.com/1024pix/pix/blob/b6835d9c6ed8e7738a270d84786e86f9159c2319/api/tests/unit/application/pre-response-utils_test.js#L33) qui génère la réponse HTTP.

Pour expliciter les raisons de ce choix, qui surprend les nouveaux venus, on pourrait :

- mettre à disposition [un ADR](https://github.com/GradedJestRisk/pix-tools/blob/e0478debe0d5454fe75844e4997fe279bac91d92/adr/handle-alternative-scenario.md) ;
- ajouter une règle de lint qui autorise explicitement à lever les erreurs dans les use-case, et l'interdire ailleurs.

### Cas 2 : Appel HTTP d'une API externe en erreur - Retourner une valeur

Lorsqu'une API externe est appelée, par exemple celle de Pole Emploi pour le SSO, on s'attend à ce qu'elle ne soit pas toujours disponible, ou qu'elle nous renvoie de temps en temps des erreurs (code 4**). Encore une fois, si nous suivons les préconisations de Martin Fowler, la fonction devrait devrait renvoyer une valeur de retour plutôt que de lever une exception.

Cette fois-ci, on constate que c'est ce que l'on a fait. Si un appel API ne s'achève pas avec succès, on renvoie un objet. Celui-ci contient tous les détails de la réponse de l'APi externe. Notez en passant que, pour faire cela, on doit intercepter les exceptions de la librairie HTTP, axios. 

```javascript
try{
    const httpResponse = await axios.get(url, config);
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

Etant donné qu'il y a peu d'appels à des API externes, les développeurs ne pouvaient pas savoir que cette décision avait été prise, et auraient implémenté les appels de manière différente.

Pour que cette solution soit utilisée sans effort, on a encapsulé la librairie dans un module, puis :

- empêché l'appel direct à la librairie avec [une règle de lint](https://github.com/1024pix/pix/blob/f379a4f381c983ab7fe1f0f495b97fdf91eddbdc/api/lib/.eslintrc.js#L8)
- qui renvoie au module et aux raisons de son choix dans un [ADR](https://github.com/1024pix/pix/blob/701407fd8694666b6bb9042eb15bdef42b2a135f/docs/adr/0024-encapsuler-appel-http.md) qui explicite les raisons de ce choix.

## Conclusion
