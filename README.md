# Staging


## Constraints

OCTO blog use Google Docs and custom scripts.

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

Newlines will have to be added manually.

## Check content

Checks:

- formatting
- dead links

```shell
npm run lint
```

## Publish

Generate HTML version

```shell
npm run generate-html
```

Paste in Google Docs

Add 2 line returns after quotes.

Publish.


## Monitor

https://github.com/octo-topi/blog-staging/graphs/traffic