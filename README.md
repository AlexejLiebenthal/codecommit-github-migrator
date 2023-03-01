oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g codecommit-github-migrator
$ cgm COMMAND
running command...
$ cgm (--version)
codecommit-github-migrator/0.0.0 darwin-arm64 node-v18.14.2
$ cgm --help [COMMAND]
USAGE
  $ cgm COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`cgm help [COMMANDS]`](#cgm-help-commands)
* [`cgm migrate`](#cgm-migrate)

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.6/src/commands/help.ts)_

## `cgm migrate`

migrates a CodeCommit Repo to GitHub

```
USAGE
  $ cgm migrate [-c <value>] [-g <value>] [-j <value>] [-p] [-h]

FLAGS
  -c, --ccRepo=codecommit://REPO                url of the CodeCommit repo
  -g, --ghRepo=https://github.com/ORG/REPO      url of the GitHub repo
  -h, --help                                    Show CLI help.
  -j, --jiraBase=https://ACCOUNT.atlassian.net  baseurl of jira
  -p, --noMirror                                set if you do not like to mirror the codecommit repo automatically

DESCRIPTION
  migrates a CodeCommit Repo to GitHub

EXAMPLES
  $ cgm migrate
```

_See code: [dist/commands/migrate.ts](https://github.com/AlexejLiebenthal/codecommit-github-migrator/blob/v0.0.0/dist/commands/migrate.ts)_
<!-- commandsstop -->
