# Le retour du GOTO

## Les exceptions

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

En 1993 : McConnell, Code complete

L'un des auteurs les plus populaires 2008 : Martin, Clean code

Plus récemment (2018), Crockford dans son style (voire acide), How Javascript works


## La règle et ses exceptions : deux exemples

2 exemples:
- traiter les cas alternatifs dans les use-case en utilisant les exceptions : DomainError
- traiter les cas alternatifs en retournant une valeur : appel HTTP externe

### Cas alternatif use-cases - Lever une exception
Détail
https://github.com/GradedJestRisk/pix-tools/blob/master/adr/handle-alternative-scenario.md


https://github.com/1024pix/pix/blob/dev/api/lib/application/pre-response-utils.js
```js
function handleDomainAndHttpErrors(
  request,
  h,
  dependencies = {
    errorManager,
  }
) {
  const response = request.response;

  if (response instanceof DomainError || response instanceof BaseHttpError) {
    return dependencies.errorManager.handle(request, h, response);
  }
  return h.continue;
}
```
Pour expliciter les raisons de ce choix, [un ADR](https://blog.octo.com/architecture-decision-record/) a été rédigé, par exemple [celui-ci](https://github.com/GradedJestRisk/pix-tools/blob/master/adr/handle-alternative-scenario.md.


### Appel HTTP en erreur - Retourner une valeur

https://github.com/1024pix/pix/blob/dev/api/lib/infrastructure/http/http-agent.js

Pour expliciter les raisons de ce choix, [un ADR](https://github.com/1024pix/pix/blob/dev/docs/adr/0024-encapsuler-appel-http.md) a été rédigé et revu par l'ensemble des équipes.
Pour assurer sa diffusion, le concept d'ADR n'étant pas courant, nous avons outillé la vérification statique (linter).
Si le développeur utilise la librairie `axios` au lieu de l'agent HTTP, la CI sort en erreur avec ce message "Please use http-agent instead (ADR 23)"

https://github.com/1024pix/pix/blob/dev/api/lib/.eslintrc.cjs