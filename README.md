# Staging area for OCTO blog posts

OCTO blog use Google Docs and custom scripts.

## Process

### Write post

Create a branch and add a folder.

Create the skeleton.

```shell
mdkir assets
touch posts.md
touch preview.md
```

Push the branch and open a pull request.
Add `under development` tag.

Write the TL;DR in `preview.md`, to be displayed on posts page.

Write your post in `post.md`; you'll have to bend your markdown usage as follows.

#### Unsupported

The following items are ignored:

- alignment
- justification
- color, size, font
- code blocks using fences "```"
- code blocks using backtick "`foo`"

#### Supported

##### Natively in markdown

The following elements from markdown are supported:

- bold
- italic
- strikethrough
- headings
- bullet lists
- tables
- horizontal line

##### Using hack

###### Quotes

Quotes are not supported natively.
You need to get the following in GoogleDoc to get it working.

```text
> myquote
NEWLINE
NEWLINE
```

But the ">" character is stripped at import, so here is the workaround :

- escape the ">" character using the backslash "\"
- after import on GoogleDoc, add MANUALLY 2 newlines.

```text
\> myquote
```

#### Deactivate lint

To use emphasis in a deep-nested section

```markdown

#### a fourth-depth section
<!-- markdownlint-disable-next-line MD036 -->
**This is important**

```

### Lint

Checks:

- formatting
- dead links

```shell
npm run lint
```

If exit code <> 0, run

And adjust rules in [configuration](./.mardownlint.jsonc)

### Ask for review

Add `ready to review` tag.

### Take feedback into account

```shell
npm run lint:fix
```

### Merge the pull request

Add `to publish` tag.

### Replace internal links (if any)

In order to test links before PR is merged, links targets the pull request itself.

After merging the pull request :

- replace links to PR by links to `main` branch
- run lint again to check for dead links
- push-force on `main`

### Import in Google

In Google Drive, create a new "Doc" document using blog template.

Name it using `preview.md`.

Generate HTML version.

```shell
npm run generate-html
```

Open the generated HTML document in Firefox.

Paste in Google Docs.

### Fix typos

Check warnings and fix back the markdown version.

### Fix unsupported markdown features

Quotes: add 2 line returns after quote body.

Code blocks: copy/paste unformatted (Ctrl/Shift/V).

Replace inline code (in green) by italics (Ctrl i).
```markdown
This is the dreaded `malloc` function.
```

Links containing several underscore `_` does not contains the leading underscore anymore, add it again.
```markdown
Do you like [snake_case_syntax](https://en.wikipedia.org/wiki/Snake_case)
```
If they still render unproperly, delete the underscore and try again.

Bold cannot contain inline code, it is rendered incorrectly between double underscore `__foo__`
```text
TL;DR: __pg_stat_activity__ view shows executing queries, __pg_stat_statements__ shows executed queries, queries can be logged
```


### Add pictures

Insert / Image / Upload from computer, choose for assets
Add "Alt text"


### Add metadata

Select "Blog OCTO" entry menu

Choose:

- main category = Software Engineering
- secondary category = Craft

Add preview from `preview.md`.

Save.

Click on preview, check the URL in pop-up match the one expected in `preview.md`.

Check the rendering browsing URL:

- look for typo;
- check quotes and code blocks are correctly rendered.

#### Publish

Publish. 

Check URL and preview rendering in [home page](https://blog.octo.com/).

Add `published` tag to the pull request.

Notify :
- OCTO by Mattermost
- everyone else by Twitter.

Have a cup of tea and relax, you've done well !

## Monitor

[](https://github.com/octo-topi/blog-staging/graphs/traffic)

## Rules

### French

### English

Don't mix french:

- use `language` instead of `langage`
- use `connection` instead of `connexion`

Semicolon is never preceded by a space, and always followed by a space.

```text
I'm done: that's a good thing.
```

[Source](https://www.sussex.ac.uk/informatics/punctuation/colonandsemi/colon#:~:text=But%20first%20please%20note%20the,have%20been%20taught%20in%20school)

Question mark are never preceded by a space.

```text
Are your for real ?
```

[Source](https://english.stackexchange.com/questions/4645/is-it-ever-correct-to-have-a-space-before-a-question-or-exclamation-mark)
