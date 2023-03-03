# codecommit-github-migrator

codecommit-github-migrator CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/codecommit-github-migrator.svg)](https://npmjs.org/package/codecommit-github-migrator)
[![CircleCI](https://circleci.com/gh/AlexejLiebenthal/codecommit-github-migrator/tree/main.svg?style=shield)](https://circleci.com/gh/AlexejLiebenthal/codecommit-github-migrator/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/codecommit-github-migrator.svg)](https://npmjs.org/package/codecommit-github-migrator)
[![License](https://img.shields.io/npm/l/codecommit-github-migrator.svg)](https://github.com/AlexejLiebenthal/codecommit-github-migrator/blob/main/package.json)

<!-- toc -->
* [codecommit-github-migrator](#codecommit-github-migrator)
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
codecommit-github-migrator/0.2.0 darwin-arm64 node-v18.14.2
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

Migrates a CodeCommit Repo to GitHub

```
USAGE
  $ cgm migrate [-c <value>] [-g <value>] [-j <value>] [-b | -M] [-h] [--awsRegion <value>]
    [--awsSessionToken <value> [--awsAccessKeyId <value> --awsSecretAccessKey <value>] ] [--awsProfile <value>]
    [--ghToken <value>]

FLAGS
  -c, --ccRepo=codecommit://REPO                url of the migration source CodeCommit repo
  -g, --ghRepo=https://github.com/ORG/REPO      url of the migration target GitHub repo
  -j, --jiraBase=https://ACCOUNT.atlassian.net  baseurl of jira

GIT FLAGS
  -M, --noMirror        set if you do not like to mirror the codecommit repo automatically
  -b, --bigFileCleanup  set if you like/need a `bfg` cleanup of big files over 100MB.
                        Can not used together with `--noMirror, -M` flag

HELP FLAGS
  -h, --help  Show CLI help.

AWS FLAGS
  --awsAccessKeyId=<value>      AWS Access Key Id can also be set through AWS_ACCESS_KEY_ID env
  --awsProfile=<value>          AWS Profile to use for credentials can also be set through AWS_PROFILE env
                                If awsProfile flag is provided, the profile will be used instead of `awsAccessKeyId` and
                                `awsSecretAccessKey`
  --awsRegion=<value>           [default: eu-central-1] AWS Region can also be set through AWS_REGION env
  --awsSecretAccessKey=<value>  AWS Secret Access Key can also be set through AWS_SECRET_ACCESS_KEY env
  --awsSessionToken=<value>     AWS Session Token can also be set through AWS_SESSION_TOKEN env

GITHUB FLAGS
  --ghToken=<value>  GitHub Token can also be set through GITHUB_TOKEN env

DESCRIPTION
  Migrates a CodeCommit Repo to GitHub

EXAMPLES
  $ cgm migrate

  $ cgm migrate -M

  $ cgm migrate -b

  $ cgm migrate -c codecommit://REPO -g https://github.com/ORG/REPO -j https://ACCOUNT.atlassian.net

  $ cgm migrate -h
```

_See code: [dist/commands/migrate.ts](https://github.com/AlexejLiebenthal/codecommit-github-migrator/blob/v0.2.0/dist/commands/migrate.ts)_
<!-- commandsstop -->
