# Le retour du GOTO

## Les exceptions

Dans [l'article précédent](../part-1/post.md), nous avons vu que les débats sur le style d'implémentation ne datent pas d'hier.
Passons aux implications actuelles.

> You might think the debate related to gotos is extinct, but (...) the goto is still alive and well and living deep in your company’s server.

> Moreover, modern equivalents of the goto debate still crop up in various guises, including debates about multiple returns, multiple loop exits, named loop exits, error processing, and exception handling.


Je vous propose de suivre la piste avec les ouvrages suivants
- 1993 : McConnell, Code complete
- 2008 : Martin, Clean code
- 2018 : Crockford, How Javascript works


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
Pour expliciter les raisons de ce choix, [un ADR](https://blog.octo.com/architecture-decision-record/) pourrait être rédigé, par exemple [celui-ci](https://github.com/GradedJestRisk/pix-tools/blob/master/adr/handle-alternative-scenario.md.


### Appel HTTP en erreur - Retourner une valeur

https://github.com/1024pix/pix/blob/dev/api/lib/infrastructure/http/http-agent.js

Pour expliciter les raisons de ce choix, [un ADR](https://github.com/1024pix/pix/blob/dev/docs/adr/0024-encapsuler-appel-http.md) a été rédigé et revu par l'ensemble des équipes.
Pour assurer sa diffusion, le concept d'ADR n'étant pas courant, nous avons outillé la vérification statique (linter).
Si le développeur utilise la librairie `axios` au lieu de l'agent HTTP, la CI sort en erreur avec ce message "Please use http-agent instead (ADR 23)"

https://github.com/1024pix/pix/blob/dev/api/lib/.eslintrc.cjs