# Le retour du GOTO

## Faire ou ne pas faire exception ?

Dans [l'article précédent](../part-1/post.md), nous avons vu que les débats sur le style d'implémentation ne datent pas d'hier.
Passons aux implications actuelles avec cet indice de Steve McConnell.
> You might think the debate related to gotos is extinct, but (...) the goto is still alive and well and living deep in your company’s server.
> Modern equivalents of the goto debate still crop up in various guises, including debates about multiple returns, multiple loop exits, named loop exits, error processing, and exception handling.

La plupart des développeurs a un avis arrêté sur la gestion des erreurs : il choisit l'une des deux options suivantes :
- lever une exception (throw - try - catch);
- renvoyer un code de retour.

En ce qui me concerne, je réponds "Ça dépend (du contexte)". Pour deux qui n'auraient pas lu l'article précédent, je vais présenter ici deux solutions en contexte réel (API REST d'une application grand public, avec plus de 50 développeurs) pour rendre explicite ma réponse.
Lorsqu'une équipe prend une décision d'implémentation, elle ne choisit pas la meilleure solution "en général", mais une solution adaptée à son contexte, à un instant donné.

Ici, confronté à deux contextes différents, l'équipe a décidé d'une solution différente (exception et code retour) pour chaque contexte, et a matérialisé les raisons de son choix dans un [ADR](https://github.com/1024pix/pix/blob/dev/docs/adr/0001-enregistrer-les-decisions-concernant-l-architecture.md) et un standard de code.

## Ce qu'en dit la littérature

### Utiliser parfois des exceptions

En 1993, dans le chapitre "Defensive programing" de "Code complete", McConnell apparente le concept d'exception au `GOTO`, ce qui nous aide à comprendre ce qui est en jeu en termes de lisibilité. L'appel d'un `GOTO` a pour effet de transférer le contrôle à n'importe quel endroit du code : quelques lignes plus loin dans la fonction, à un autre endroit du fichier, ou dans n'importe quel autre fichier - on change brutalement de contexte, ce qui extrait l'attention du développeur d'une portion de code restreinte, la fonction en cours d'exécution à une autre portion. Dans le cas de l'exception, le contrôle n'est pas transféré n'importe où, mais potentiellement dans n'importe quel parent dans la pile d'appel, voir au processus appelant.

S'il ne fallait en retenir qu'une phrase
> Used judiciously, they can reduce complexity. Used imprudently, they can make code almost impossible to follow.

[//]: # (TODO: L'exemple est-il utile ?)
```javascript
// some-file
function foobar(){ 
    // some code which may throw
}
function foo(){
    throw new CustomException();
}

function bar(){
    try {
        foobar();
        foo();
    } catch(e){
        if (e instanceof anotherCustomException){
            // do something
        }
    }
}

// another-file
function main(){
    try{
        baz();
        bar();
    } catch(e){
        if (e instanceof domainException) {
            // more handling conditionals..
        }
    }
}
``` 

McConnell attire l'attention sur le fait que, face à une erreur, on peut soit favoriser :
-  l'intégrité (ex: pour un matériel d'irradiation médical) et arrêter totalement l'application (la fonction lance une exception, interceptée par une fonction d'arrêt de l'appareil);
- la robustesse (ex: pour l'affichage d'un traitement de texte) et continuer à peu près comme de si rien n'était (auquel cas la fonction ne lance pas d'exception).

La gestion des erreurs n'est pas toujours une exigence technique, mais parfois une exigence fonctionnelle.
Une fois cela dit, il liste sur une dizaine de pages [des critères précis](./excerpts.md) pour utiliser judicieusement les exceptions.

### Utiliser souvent des exceptions

2008 voit la publication par Martin du livre le plus connu aujourd'hui sur la lisibilité du code : "Clean code".
Dans [le chapitre consacré à la gestion d'erreur](./excerpts.md), Michael Feathers défend l'utilisation des exceptions au lieu de codes de retour. Il a pour but d'isoler le comportement nominal du comportement exceptionnel (erreur).

> Error handling is important, but if it obscures logic, it’s wrong. (..) We can write robust clean code if we see error handling as a separate concern, something that is viewable independently of our main logic. To the degree that we are able to do that, we can reason about it independently, and we can make great strides in the maintainability of our code.

### Utiliser rarement des exceptions

Plus récemment (2018), dans "How Javascript works", Crockford est [très critique](./excerpts.md) envers l'usage actuel des exceptions.
Dans le même style radical que dans "The Good Parts", il explique que les exceptions ont été détournées de leur but initial, la gestion des erreurs, pour être utilisée comme n'importe quelle structure de contrôle. Il prescrit d'utiliser les code de retour dans la plupart des cas, et de garder les exceptions pour les seuls cas "désespérés".

> Reasoning about error recovery is difficult. So we should go with the pattern that is simple and reliable. Make all the expected outcome into return values. Save the exception for exceptions

### Erreur, vous avez dit erreur ?

Avant de passer au cas pratique et de découvrir si le choix qui a été fait suit les préconisations d'un de ces trois livres (qui a raison après tout ?), il est important de faire un point de vocabulaire : qu'entendons-nous par exception ?

Tous les développeurs connaissent l'élément de langage de programmation `(throw) exception`, mais les auteurs ci-dessus insistent sur la notion d'erreur : toutes les erreurs ne font pas l'objet d'exceptions. Pour clarifier ce point, je propose d'utiliser les mêmes termes que pour les cas d'utilisation en UML : nominal, alternatif, exceptionnel. Tout le monde est à peu près d'accord sur ce qu'est un cas nominal, c'est quand tout va bien. Par contre, ce qui distingue un cas alternatif et un cas exceptionnel est trop souvent une affaire de goût personnel. Crockford dit que, dans le cas d'un programme qui lit un fichier, le fait que le fichier n'existe pas n'est pas une exception.

Si les développeurs arrivent à se mettre d'accord, de préférence avec l'avis du métier, sur ce qui est une exception et sur ce qui ne l'est pas, le code aura plus de chance d'être lisible. Si l'on suit Michael Feathers, ce sont les cas nominaux et alternatifs qui constituent le corps du programme (`the main logic`). Si une grande partie du code est consacré à la gestion d'erreur, ce ne sont pas des erreurs, mais des cas alternatifs : ils doivent être réintégrés au code principal.

## La règle et ses exceptions : deux exemples

Ces deux cas pratiques concernent les cas alternatifs :
- l'un utilise les exceptions pour les cas alternatifs dans les use-case (DomainError) en utilisant les exceptions ;
- l'autre retourne une valeur de retour lors des appels HTTP externes.

### Cas alternatif use-cases - Lever une exception

Lors du traitement d'une requête API, un chemin nominal est attendu :
- l'utilisateur a les droits d'effectuer cet appel ;
- les données fournies par l'utilisateur sont valides ;
- les données existantes sont compatibles avec la demande effectuée par l'utilisateur.

Le corps principal du traitement effectue ces vérifications, mais si l'une d'elle échoue, il initie une exception.
Prenons l'exemple de l'ajout d'un administrateur, sur un POST de la route `/api/admin/admin-members`. 
Plusieurs demandes peuvent être envoyées par l'IHM d'administration : connexion instable, plusieurs utilisateurs effectuant la demande en même temps. Ce n'est pas un scénario nominal, mais rien d'exceptionnel non plus. On signale simplement à l'utilisateur que sa demande ne peut aboutir, avec une réponse UnprocessableEntityError (422).

Pourtant, on lève une exception dans le use-case
```javascript
throw new AlreadyExistingAdminMemberError();
```
[source](https://github.com/1024pix/pix/blob/dev/api/lib/domain/usecases/save-admin-member)

```javascript
class AlreadyExistingAdminMemberError extends Domain  Error {
  constructor(message = 'Cet agent a déjà accès') {
    super(message);
  }
}
```
[source](https://github.com/1024pix/pix/blob/dev/api/lib/domain/errors.js#L18-L18)

Pourquoi ? Dans l'architecture existante, le use-case est appelé par un contrôleur HTTP, lui-même appelé par le routeur du framework, HapiJs.
Si nous suivons les préconisations de la littérature, le use-case devrait renvoyer un code retour au contrôleur, qui se chargerait de répondre une 422. Ce n'est pas le cas ici, mais le use-case pourrait déléguer la vérification à un service : ce service devrait renvoyer un code retour au use-case, qui lui-même le renverrait au contrôleur. Cela rajouterait du code avec peu de valeur ajoutée à plusieurs endroits. Nous avons donc exploité la fonctionnalité de hook du framework, pour intercepter l'exception avant de répondre à l'utilisateur : nous n'avons qu'à la transformer en réponse 422.

```javascript
function handleDomainAndHttpErrors( request, errorManager) {
  const response = request.response;
  if (response instanceof DomainError) {
    return errorManager.handle(request, response);
  }
}
```
[source](https://github.com/1024pix/pix/blob/dev/api/lib/application/pre-response-utils.js)

```javascript
if (error instanceof DomainErrors.AlreadyExistingAdminMemberError) {
    return new HttpErrors.UnprocessableEntityError(error.message);
}
```
[source](https://github.com/1024pix/pix/blob/dev/api/lib/application/error-manager.js#L349-L351)

Ce compromis fonctionne bien, car la même stratégie est appliquée sur tous les use-case et que la définition du cas alternatif est partagée dans les équipes. Les exceptions sont déclarées dans un dossier dédié dans le domaine, et gérée par un code générique. Le fait que le use-case lève une exception [est testé unitairement](https://github.com/1024pix/pix/blob/dev/api/tests/unit/domain/usecases/save-admin-member_test.js#L76-L76), tout comme le code de gestion de l'exception.

Pour expliciter les raisons de ce choix, qui peut surprendre les nouveaux venus, [un ADR a été rédigé](https://github.com/GradedJestRisk/pix-tools/blob/master/adr/handle-alternative-scenario.md.

### Appel HTTP en erreur - Retourner une valeur

https://github.com/1024pix/pix/blob/dev/api/lib/infrastructure/http/http-agent.js

Pour expliciter les raisons de ce choix, [un ADR](https://github.com/1024pix/pix/blob/dev/docs/adr/0024-encapsuler-appel-http.md) a été rédigé et revu par l'ensemble des équipes.
Pour assurer sa diffusion, le concept d'ADR n'étant pas courant, nous avons outillé la vérification statique (linter).
Si le développeur utilise la librairie `axios` au lieu de l'agent HTTP, la CI sort en erreur avec ce message "Please use http-agent instead (ADR 23)"

https://github.com/1024pix/pix/blob/dev/api/lib/.eslintrc.cjs

## Conclusion
