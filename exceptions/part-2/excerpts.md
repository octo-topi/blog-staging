# Excerpts

You'll find below excerpts from the following texts:

* 1993 : McConnell, Code complete;
* 2008 : Robert Matin, Clean code;
* 2018 : Douglas Crockford, How Javascript works.

Ambrose Bierce defined quotation in the following way : “Quotation, n: The act of repeating erroneously the words of another.”.
The mere act of choosing one part of a text is subjective and arbitrary, and fundamentally misleading : the author make its point in a dozen pages, and I choose the part I liked, presenting it as the essence of its thought.

Nevertheless, I did it here to give you a taste, so you may have a chance of reading the text yourself.

## Code complete

> You might think the debate related to gotos is extinct, but (...) the goto is still alive and well and living deep in your company’s server. Moreover, modern equivalents of the goto debate still crop up in various guises, including debates about multiple returns, multiple loop exits, named loop exits, error processing, and exception handling.
>
> Exceptions have an attribute in common with inheritance: used judiciously, they can reduce complexity. Used imprudently, they can make code almost impossible to follow. This section contains suggestions for realizing the benefits of exceptions and avoiding the difficulties often associated with them.
>
> * Use exceptions to notify other parts of the program about errors that should not be ignored
> * Throw an exception only for conditions that are truly exceptional
> * Don’t use an exception to pass the buck (if an error condition can be handled locally, handle it locally)
> * Avoid throwing exceptions in constructors and destructors unless you catch them in the same place
> * Throw exceptions at the right level of abstraction
> * Include in the exception message all information that led to the exception
> * Avoid empty catch blocks
> * Know the exceptions your library code throws
> * Consider building a centralized exception reporter
> * Standardize your project’s use of exceptions
> * Consider alternatives to exceptions

## Clean code

Chapter "Error handling" 's headings are the following :

* Use Exceptions Rather Than Return Codes
* Write Your Try-Catch-Finally Statement First
* Use unchecked exceptions
* Provide context with exceptions
* Define exception classes in terms of a caller's need
* Define the normal flow
* Don't return null
* Don't pass null

> Many code bases are completely dominated by error handling. When I say dominated, I don’t mean that error handling is all that they do. I mean that it is nearly impossible to see what the code does because of all the scattered error handling. Error handling is important, but if it obscures logic, it’s wrong.
>
> Back in the distant past there were many languages that didn’t have exceptions. In those languages the techniques for handling and reporting errors were limited. You either set an error flag or returned an error code that the caller could check. The problem with these approaches is that they clutter the caller. The caller must check for errors immediately after the call. Unfortunately, it’s easy to forget. For this reason it is better to throw an exception when you encounter an error. The calling code is cleaner. Its logic is not obscured by error handling.

## How Javascript works

> There is often an implicit assumption in our programs that everything will go always go right, but even an optimist knows that sometimes thing can go wrong. (...) There is a possibility that the function we call might fail in an unexpected way.  (...) The most popular approach to this problem is exception handling with attempts to free us to program optimistically.

```javascript
try {
    plan_a();
} catch {
    plan_b();
}
```

> We do not have to check for obscure error codes in every return value. (...)
> The most popular misuse of exceptions is to use them to communicate normal results. For example, given a function that read a file, a `file not found error` should not be an exception. It is a normal occurrence. Exceptions should only be used for problems that should not be anticipated.
> Reasoning about error recovery is difficult. So we should go with the pattern that is simple and reliable. Make all the expected outcome into return values. Save the exception for exceptions. (...)
>
> When something goes seriously wrong, what can a program be expected to do about it ? (...)
> It is not reasonable to expect, at our current level of technology, that the function can take corrective action. (...)
> The details in the exception object might be important ands useful for the programmer to know. That information is instead delivered to a function that can make no good use of it. We have corrupted the information flow. That information should be sent to the programmer, perhaps in the form of a journal entry. Instead, it is sent down the call stack, where it can be misunderstood and forgotten.

[//]: # (TODO: Ajouter le passage sur l'appelant qui ne sait pas quoi faire parce qu'il n'a pas le contexte.)
