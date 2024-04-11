# Summary

You'll find below excerpts from the following texts:

* 1955 : Gouldner, Wildcat strike: a study in worker–management relationships
* 1968 : Dijkstra, GOTO considered harmful
* 1974:  Knuth, Structured programing with Go to statements
* 1981:  Sheil, The psychological study of programming
* 1987:  Dijkstra, On a Somewhat disappointing correspondence

The complete text of Dijkstra, Structured programing (1972) [is available here](./assets/StructuredProgramming.pdf).
It has been made publicly available by [the ACM](https://dl.acm.org/doi/10.5555/1243380).

## A study in worker–management relationships

The aphorism "Context is everything" stems from this social science text.

> Social scientists of the most varying standpoints agree that human action can be rendered meaningful only by relating it to the contexts in which it takes place. The meaning and consequences of a behaviour pattern will vary with the contexts in which it occurs. This is commonly recognized in the saying that there is a “time and a place for everything”. There should be no implication, however, that the social scientist is a sort of "happy savage" who has merely to reach out his hand to pluck these "contexts" from some tree of knowledge, where they hang waiting to edify him.

[Complete text](https://www.health.org.uk/sites/default/files/PerspectivesOnContextBateContextIsEverything.pdf)

## GOTO considered harmful

> My first remark is that, although the programmer’s activity ends when he has constructed a correct program, the process taking place under control of his program is the true subject matter of his activity, for it is this process that has to accomplish the desired effect; it is this process that in its dynamic behavior has to satisfy the desired specifications. Yet, once the program has been made, the “making” of the corresponding process is delegated to the machine.

> My second remark is that our intellectual powers are rather geared to master static relations and that our powers to visualize processes evolving in time are relatively poorly developed. For that reason we should do (as wise programmers aware of our limitations) our utmost to shorten the conceptual gap between the static program and the dynamic process, to make the correspondence between the program (spread out in text space) and the process (spread out in time) as trivial as possible.

> The go to statement as it stands is just too primitive; it is too much an invitation to make a mess of one’s program. One can regard and appreciate the clauses considered as bridling its use.

[Complete text](./assets/GotoStatementConsideredHarmful-1.pdf)

## Structured programming with Goto statements
>
> Will Utopia 84, or perhaps we should call it NEWSPEAK, contain go to statements?

> I believe that by presenting such a view I am not in fact disagreeing sharply with Dijkstra’s ideas, since he recently wrote the following: "Please don’t fall into the trap of believing that I am terribly dogmatical about the go to statement. I have the uncomfortable feeling that others are making a religion out of it, as if the conceptual problems of programming could be solved by a single trick, by a simple form of coding discipline!"
> In other words, it seems that fanatical advocates of the New Programming are going overboard in their strict enforcement of morality and purity in programs.

> Something a little like this is happening in computer science. In the late 1960’s we witnessed a “software crisis”, which many people thought was paradoxical because programming was supposed to be so easy. As a result of the crisis, people are now beginning to renounce every feature of programming that can be considered guilty by virtue of its association with difficulties. Not only go to statements are being questioned; we also hear complaints about floating-point calculations, global variables, semaphores, pointer variables, and even assignment statements. Soon we might be restricted to only a dozen or so programs that are sufficiently simple to be allowable; then we will be almost certain that these programs cannot lead us into any trouble, but of course we won’t be able to solve many problems.

> He taught them to use go to only in unusual special cases where if and while aren’t right, but he found that “A disturbingly large percentage of the students ran into situations that require go to’s, and sure enough, it was often because while it didn't work well to their plan, but almost invariably because their plan was poorly thought out.” Because of arguments like this, I’d say we should, indeed, abolish go to from the high-level language, at least as an experiment in training people to formulate their abstractions more carefully. This does have a beneficial effect on style, although I would not make such a prohibition if the new language features described above were not available. The question is whether we should ban it, or educate against it; should we attempt to legislate program morality ? In this case I vote for legislation, with appropriate legal substitutes in place of the former overwhelming temptations.

[Complete text](./assets/StructuredProgrammingWithGoto.pdf)

## The psychological study of programming

> On the other hand, one could argue that the results of these experiments simply do not bear on the methodology of structured programming that they purport to test. As Dijkstra points out in the title of his book, A Discipline of Programming , any reasonable programming methodology is a discipline, a way of thinking, not just a collection of programming constructs. The empirical claim of structured programming is that a programmer who approaches problems in a certain way will be more effective. The syntactic constructs are appropriate to that approach, but they are not themselves that approach. Therefore, there is no reason to believe that their presence or absence will, by itself, have any significant impact. Either the programmer understands the structured approach to programming, in which case her code will reflect it {whether or not structured control constructs are available), or the programmer does not, in which case the presence of syntactic constructs is irrelevant.

[Complete text](assets/PsychologicalStudyProgramming.pdf)

## On a Somewhat disappointing correspondence

> By my standards, a competent professional programmer in 1987
>
> * should recognize that Rubin’s problem asks to be solved by a nested application of the same algorithm;
> * should know the theorem of “The bounded linear search”;
> * should be able to derive that theorem and its proof;
> * should not hesitate to use it;
> * should not waste his time in pointing out that the boolean variable d is superfluous;
> * should keep his repetitions simple and disentangled;
> * etc. . .

> Evidently, my priorities are not shared by everyone, for Rubin’s letter and most of the five reactions it evoked were conducted instead in terms of all sorts of “programming language features” that seem better ignored than exploited. The whole correspondence was carried out at a level that vividly reminded me of the intellectual climate of twenty years ago, as if stagnation were the major characteristic of the computing profession, and that was a disappointment.

[Complete text](assets/OnASomewhatDisapointingCorrespondence.pdf)
