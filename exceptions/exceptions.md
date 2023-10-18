# Exceptions

La seule fois où mon évaluation portait sur un point technique fut "a utilisé un GOTO".
Context is everything, Falsifiable, 


> Social scientists of the most varying standpoints agree that human action can be rendered meaningful only by relating  it to the contexts in which it takes place. The meaning and consequences of a behaviour pattern will vary with the  contexts in which it occurs. This is  commonly recognized in the saying that there is a “time and a place for everything”. There should be no implication, however, that the social scientist is a sort of "happy savage" who has merely to reach out his hand to pluck these "contexts" from some tree of knowledge, where they hang waiting to edify him.

Alvin Gouldner, 19551 Wildcats trike: a study in worker–management relationships. London: Routledge; 1955, page 12

https://www.health.org.uk/sites/default/files/PerspectivesOnContextBateContextIsEverything.pdf


1968 : Dijkstra, GOTO considered harmful
1974:  Knuth, Structured programing with Go to statements
1993 : McConnell, Code complete
2008 : Robert Matin, Clean code
2018 : Douglas Crockford, How Javascript works 

## GOTO considered harmful


> My first remark is that, although the programmer’s activity ends when he has constructed a correct program, the process taking place under control of his program is the true subject matter of his activity, for it is this process that has to accomplish the desired effect; it is this process that in its dynamic behavior has to satisfy the desired specifications. Yet, once the program has been made, the “making” of the corresponding process is delegated to the machine.

> My second remark is that our intellectual powers are rather geared to master static relations and that our powers to visualize processes evolving in time are relatively poorly developed. For that reason we should do (as wise programmers aware of our limitations) our utmost to shorten the conceptual gap between the static program and the dynamic process, to make the correspondence between the program (spread out in text space) and the process (spread out in time) as trivial as possible.

> The go to statement as it stands is just too primitive; it is too much an invitation to make a mess of one’s program. One can regard and appreciate the clauses considered as bridling its use.

## Structured programming with Goto statements



I believe that by presenting such a view I
am not in fact disagreeing sharply with
Dijkstra’s ideas, since he recently wrote the
following: “Please don’t fall into the trap of
believing that I am terribly dogmatical
about [the go to statement]. I have the
uncomfortable feeling that others are making
a religion out of it, as if the conceptual
problems of programming could be solved by
a single trick, by a simple form of coding
discipline!” [29]. In other words, it seems
that fanatical advocates of the New Pro-
gramming are going overboard in their strict
enforcement of morality and purity in
programs. Sooner or later people are going
to find that their beautifully-structured


Something a little like this is happening
in computer science. In the late 1960’s we
witnessed a “software crisis”, which many
people thought was paradoxical because
programming was supposed to be so easy.
As a result of the crisis, people are now be-
ginning to renounce every feature of pro-
gramming that can be considered guilty by
virtue of its association with difficulties. Not
only go to statements are being questioned;
we also hear complaints about floating-point
calculations, global variables, semaphores,
pointer variables, and. even assignment
statements. Soon we might be restricted to
only a dozen or so programs that are suffi-
ciently simple to be allowable; then we will
be almost certain that these programs
eannot lead us into any trouble, but of
course we won’t be able to solve many
problems.





He taught them to use go to
only in unusual special cases where if and
while aren’t right, but he found that
“A disturbingly large percentage of the
students ran into situations that require
go to’s, and sure enough, it was often because
while didn’t work well to their plan, but
almost invariably because their plan was
poorly thought out.” Because of arguments
like this, I’d say we should, indeed, abolish.
go to from the high-level language, at least
as an experiment in training people to
formulate their abstractions more carefully.
This does have a beneficial effect on style,
although I would not make such a prohibition if the new language features described
above were not available. The question is
whether we should ban it, or educate against
it; should we attempt to legislate program
morality? In this case I vote for legislation,
with appropriate legal substitutes in place
of the former overwhelming temptations.





## Code complete    

> You might think the debate related to gotos is extinct, but (...) the goto is still alive and well and living deep in your company’s server. Moreover, modern equivalents of the goto debate still crop up in various guises, including debates about multiple returns, multiple loop exits, named loop exits, error processing, and exception handling.


## Clean code

> Many code bases are completely dominated by error handling. When I say dominated, I don’t mean that error handling is all that they do. I mean that it is nearly impossible to see what the code does because of all of the scattered error handling. Error handling is important, but if it obscures logic, it’s wrong.


Use Exceptions Rather Than Return Codes

## How Javascript works

> There is often an implicit assumption in our programs that everything will go always go right, but even an optimist knows that sometimes thing can go wrong. (...) 
> There is a possibility that the function we call might fail in an unexpected way.  (...) 
> The most popular approach to this problem is exception handling with attempts to free us to program optimistically.
> We do not have to check for obscure error codes in every return value. (...)
> The most popular misuse of exceptions is to use them to communicate normal results. For example, given a function that read a file, a `file not found error` should not be an exception. It is a normal occurrence. Exceptions should only be used for problems that should not be anticipated.

```javascript
try {
    plan_a();
} catch {
    plan_b();
}
```
> Reasoning about error recovery is difficult. So we should go with the pattern that is simple and reliable. Make all the expected outcome into return values. Save the exception for exceptions. (...)
> When something goes seriously wrong, what can a program be expected to do about it ? (...)
> It is not reasonable to expect, at our current level of technology, that the function can take corrective action. (...)
> The details in the exception object might be important ands useful for the programmer to know. That information is instead delivered to a function that can make no good use of it. We have corrupted the information flow. That information should be sent to the programmer, perhaps in the form of a journal entry. Instead, it is sent down the call stack, where it can be misunderstood and forgotten.


## Pix

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
  },
) {
  const response = request.response;

  if (response instanceof DomainError || response instanceof BaseHttpError) {
    return dependencies.errorManager.handle(request, h, response);
  }
  return h.continue;
}
```

### Appel HTTP en erreur - Retourner une valeur

https://github.com/1024pix/pix/blob/dev/api/lib/infrastructure/http/http-agent.js