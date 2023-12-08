# Excerpts

You'll find below excerpts from the following texts:
* 1993 : McConnell, Code complete
* 2008 : Robert Matin, Clean code
* 2018 : Douglas Crockford, How Javascript works

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
> 