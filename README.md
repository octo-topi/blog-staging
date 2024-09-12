# Staging area for OCTO blog posts

OCTO blog use Google Docs and custom scripts.

## Process

### Write post

Write your post, bending your markdown usage as follows.

#### Unsupported

The following items are ignored:

- alignment
- justification
- color, size, font
- code blocks using fences "```"

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

### Lint

Checks:

- formatting
- dead links

```shell
npm run lint
```

If exit code <> 0, run

```shell
npm run lint:fix
```

And adjust rules in [configuration](./.mardownlint.jsonc)

### Ask for review

### Take feedback into account

### Merge the pull request

### Replace internal links (if any)

In order to test links before PR is merged, links targets the pull request itself.

After merging the pull request :
- replace links to PR by links to `main` branch
- run lint again to check for dead links
- push-force on `main`

### Publish

Generate HTML version.

```shell
npm run generate-html
```

Paste in Google Docs.

Then do manual stuff:

- add 2 line returns after quotes
- copy/paste code blocks with Ctrl/Shift/V

Preview.

Add categories and short version.

Publish.

### Monitor

[](https://github.com/octo-topi/blog-staging/graphs/traffic)
