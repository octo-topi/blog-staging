# Staging

## Writing an article

### Constraints

OCTO blog use Google Docs and custom scripts.

#### Unsupported

The following items are ignored:

- alignment
- justification
- color, size, font

#### Allowed

##### Natively in markdown

The following elements from markdown are handled:

- bold
- italic
- strikethrough
- headings
- bullet lists
- tables
- horizontal line

##### Using hack

###### Quotes

It does not support quote natively. The custom syntax is the following.

```text
> myquote
NEWLINE
NEWLINE
```

In order to manage this, markdown quote cannot be used, so here is the workaround.

```text
\> myquote
```

Newlines will have to be added manually in Google docs.

## Check content

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

## Ask for review

## Take review in to account

## Replace links

In order to test links before PR is merged, links targets the pull request itself.

Before publishing :

- merge pull request
- replace link to PR by link to `main` branch
- run link again to check
- push-force

## Publish

Generate HTML version

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

## Monitor

[](https://github.com/octo-topi/blog-staging/graphs/traffic)
