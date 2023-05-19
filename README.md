# codecommit-github-migrator (`cgm`)

This tool helps to migrate repositories from CodeCommit with all open PullRequests to GitHub.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/codecommit-github-migrator.svg)](https://npmjs.org/package/codecommit-github-migrator)
[![Downloads/week](https://img.shields.io/npm/dw/codecommit-github-migrator.svg)](https://npmjs.org/package/codecommit-github-migrator)
[![License](https://img.shields.io/npm/l/codecommit-github-migrator.svg)](https://github.com/AlexejLiebenthal/codecommit-github-migrator/blob/main/package.json)

<!-- toc -->
* [codecommit-github-migrator (`cgm`)](#codecommit-github-migrator-cgm)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

## Prepare

As prerequisitory you should have `git` installed and configured.

You should also have already created the target GitHub repository manually.

Additionally you will also need AWS and GitHub Access Token.
They can be read automatically from your ENV variables.
If you don't provide any auth flags AWS will fallback to your `.aws/credentials` and `.aws/config` file. If you don't provide a GitHub Token the tool tries to get the token from the `gh`-CLI (`gh auth token`)

## Install `cgm`

<!-- usage -->
```sh-session
$ npm install -g codecommit-github-migrator
$ cgm COMMAND
running command...
$ cgm (--version)
codecommit-github-migrator/0.2.5 darwin-arm64 node-v18.16.0
$ cgm --help [COMMAND]
USAGE
  $ cgm COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`cgm help [COMMANDS]`](#cgm-help-commands)

## `cgm help [COMMANDS]`

Display help for cgm.

```
USAGE
  $ cgm help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for cgm.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.9/src/commands/help.ts)_
<!-- commandsstop -->
