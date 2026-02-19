[tree-sitter-fish](https://github.com/ram02z/tree-sitter-fish/pull/36)
================

Fish grammar for [tree-sitter](https://github.com/tree-sitter/tree-sitter). Adds

Dev release that adds `{ [COMMAND...]; }` `begin`/`end` support from [feat/begin-end](https://github.com/ndonfris/tree-sitter-fish/tree/feat/begin-end-curly-bracket-syntax), and publishes as `@ndonfris/tree-sitter-fish@3.6.0-patch.2` to [npm](https://www.npmjs.com/package/@ndonfris/tree-sitter-fish).

Mostly just a temporary fork meant to upstream (`@esdmr/tree-sitter-fish`)[https://github.com/esdmr/tree-sitter-fish] until [PR #36](https://github.com/ndonfris/tree-sitter-fish/tree/feat/begin-end-curly-bracket-syntax) is merged into `tree-sitter-fish` for [`fish-lsp`](https://fish-lsp.dev) to use.

### Development

Install the dependencies:

    npm install

Run the tests:

    npm run test

Run the build and tests in watch mode:

    npm run test:watch

Test parser against [fish-shell](https://github.com/fish-shell/fish-shell/tree/master/share) `/share` fish files:

    npm run test:examples

#### References
* [tree-sitter-bash](https://github.com/tree-sitter/tree-sitter-bash)
* [Fish Shell Introduction](https://fishshell.com/docs/current/index.html)
