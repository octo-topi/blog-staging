# Excerpts

You'll find below excerpts from the following texts:

* 1993 : McConnell, Code complete;
* 1999 : Hunt and Thomas, The pragmatic programmer;
* 2007 : Kent Beck, Implementations patterns;
* 2008 : Robert Martin, Clean code;
* 2018 : Douglas Crockford, How Javascript works.

## Code complete

### Part II : Creating High-Quality Code

#### Chapter 8: Defensive Programming

##### Section 8.4 :  Exceptions

> Exceptions have an attribute in common with inheritance: used judiciously, they can reduce complexity. Used imprudently, they can make code almost impossible to follow. This section contains suggestions for realizing the benefits of exceptions and avoiding the difficulties often associated with them.

* Use exceptions to notify other parts of the program about errors that should not be ignored
* Throw an exception only for conditions that are truly exceptional
* Don’t use an exception to pass the buck (if an error condition can be handled locally, handle it locally)
* Avoid throwing exceptions in constructors and destructors unless you catch them in the same place
* Throw exceptions at the right level of abstraction
* Include in the exception message all information that led to the exception
* Avoid empty catch blocks
* Know the exceptions your library code throws
* Consider building a centralized exception reporter
* Standardize your project’s use of exceptions
* Consider alternatives to exceptions

### Part IV: Statements

#### Chapter 17: Unusual Control Structures

##### Section 17.3 : goto

> You might think the debate related to gotos is extinct, but (...) the goto is still alive and well and living deep in your company’s server. Moreover, modern equivalents of the goto debate still crop up in various guises, including debates about multiple returns, multiple loop exits, named loop exits, error processing, and exception handling.

## The pragmatic programmer

### When to Use Exceptions

#### Introduction

> We suggested that it is good practice to check for every possible error—particularly the unexpected ones. However, in practice this can lead to some pretty ugly code; the normal logic of your program can end up being totally obscured by error handling.

#### What Is Exceptional ?
>
> One of the problems with exceptions is knowing when to use them. We believe that exceptions should rarely be used as part of a program’s normal flow; exceptions should be reserved for unexpected events. For example, if your code tries to open a file for reading and that file does not exist, should an exception be raised? Our answer is, “It depends.” If the file should have been there, then an exception is warranted. Something unexpected happened - a file you were expecting to exist seems to have disappeared. On the other hand, if you have no idea whether the file should exist or not, then it doesn't seem exceptional if you can’t find it, and an error return is appropriate. Why do we suggest this approach to exceptions? Well, an exception represents an immediate, nonlocal transfer of control—it’s a kind of cascading goto. Programs that use exceptions as part of their  normal processing suffer from all the readability and maintainability problems of classic spaghetti code. These programs break encapsulation: routines and their callers are more tightly coupled via exception handling.

## Implementations patterns

### Chapter 7, Behavior

#### Exceptional Flow

> Programs are easiest to read if the statements execute one after another. Readers can use comfortable and familiar prose-reading skills to understand the intent of the program. Sometimes, though, there are multiple paths through a program. Expressing all paths equally would result in a bowl of worms, with flags set here and used there and return values with special meanings. Answering the basic question, “What statements are executed?” becomes an exercise in a combination of archaeology and logic. Pick the main flow. Express it clearly. Use exceptions to express other paths.

#### Guard clauses

Version without guard clause

```java
void initialize() {
    if (!isInitialized()) {
        foo();
    } 
}
```

Version with guard clause

```java
void initialize() {
    if (isInitialized()) return;
    foo();
```

> If-then-else expresses alternative, equally important control flows. A guard clause is appropriate for expressing a different situation, one in which one of the control flows is more important than the other. Back in the old days of programming, a commandment was issued: each routine shall have a single entry and a single exit. This was to prevent the confusion possible when jumping into and out of many locations in the same routine. It made good sense when applied to FORTRAN or assembly language programs written with lots of global data where even understanding which statements were executed was hard work. In Java, with small methods and mostly local data, it is needlessly conservative. However, this bit of programming folklore, thoughtlessly obeyed, prevents the use of guard clauses.

#### Exceptions

> They make it difficult to trace the flow of control, since adjacent statements can be in different methods, objects, or packages. Code that could be written with conditionals and messages, but is implemented with exceptions, is fiendishly difficult to read as you are forever trying to figure out what more is going on than a simple control structure. In short, express control flows with sequence, messages, iteration, and conditionals (in that order) wherever possible. Use exceptions when not doing so would confuse the simply communicated main flow.

## Clean code

### Chapter Error handling

#### Introduction

> Many code bases are completely dominated by error handling. When I say dominated, I don’t mean that error handling is all that they do. I mean that it is nearly impossible to see what the code does because of all the scattered error handling. Error handling is important, but if it obscures logic, it’s wrong.

Headings are the following :

* Use Exceptions Rather Than Return Codes
* Write Your Try-Catch-Finally Statement First
* Use unchecked exceptions
* Provide context with exceptions
* Define exception classes in terms of a caller's need
* Define the normal flow
* Don't return null
* Don't pass null

### Section "Use Exceptions Rather Than Return Codes"

> Back in the distant past there were many languages that didn't have exceptions. In those languages the techniques for handling and reporting errors were limited. You either set an error flag or returned an error code that the caller could check. The problem with these approaches is that they clutter the caller. The caller must check for errors immediately after the call. Unfortunately, it’s easy to forget. For this reason it is better to throw an exception when you encounter an error. The calling code is cleaner. Its logic is not obscured by error handling.

### Conclusion

> We can write robust clean code if we see error handling as a separate concern, something that is viewable independently of our main logic. To the degree that we are able to do that, we can reason about it independently, and we can make great strides in the maintainability of our code.

## How Javascript works

### Chapter exceptions

#### Use return rather than exceptions

> There is often an implicit assumption in our programs that everything will go always go right, but even an optimist knows that sometimes thing can go wrong. (...) There is a possibility that the function we call might fail in an unexpected way.  (...) The most popular approach to this problem is exception handling with attempts to free us to program optimistically. (...) We do not have to check for obscure error codes in every return value. Instead, we assume that everything works correctly. If something unexpected happens, the current activity will stop and our exception handler will determine what the program will do next. (...)

```javascript
try {
    plan_a();
} catch {
    plan_b();
}
```

#### Use exception for exceptional scenarios

> The most popular misuse of exceptions is to use them to communicate normal results. For example, given a function that read a file, a `file not found error` should not be an exception. It is a normal occurrence. Exceptions should only be used for problems that should not be anticipated.
> Reasoning about error recovery is difficult. So we should go with the pattern that is simple and reliable. Make all the expected outcome into return values. Save the exception for exceptions. The problem is that there are a lot of programs that were developed by people who were damaged by their experience with other languages. They use throw when they should return. They make complex catch clause that attempt to solve insolvable problems and maintain unmaintainable invariants.

#### Do not use exception to communicate normal results

> The Java language encourage misuses of exceptions as a way to get around problems in its type system. A Java method can only return a single type of return, so exceptions are used as an alternate channel to return the ordinary results that the type system does not allow. This can lead to several catch clauses attached to a single try bloc.  It can be confusing because the ordinary results get jumbled up with the real exceptions. It resembles a FORTRAN assigned GOTO statement, in which a variable contains the address of teh destination of the jump. (...) The control paths are dictated by the method that created the exception object. That creates a tight coupling between the thrower and the catcher that works again clean modular design.

#### Exceptional scenario recovery should be local

> When something goes seriously wrong, what can a program be expected to do about it ? (...) It is not reasonable to expect, at our current level of technology, that the function can take corrective action. (...)
> The details in the exception object might be important ands useful for the programmer to know. That information is instead delivered to a function that can make no good use of it. We have corrupted the information flow. That information should be sent to the programmer, perhaps in the form of a journal entry. Instead, it is sent down the call stack, where it can be misunderstood and forgotten.

#### Specific exceptions issues in Javascript

##### Security

> There is an important model of security that limits the destructive power of functions by giving them only the references they need to do their work and nothing more. Exceptions, asu currently practiced, provide a channel thru which two untrusted functions can collude.

##### Eventual

> Exceptions work by unwinding the stack. Thrown values are communicated to function invocations that are lower on the stack. In eventual programming, the stack is emptied after each turn. Time travel is not available for transmitting a thrown exception value to an activation that no longer exists.
