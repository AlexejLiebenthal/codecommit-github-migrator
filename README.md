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
codecommit-github-migrator/0.0.0 darwin-arm64 node-v16.19.0
$ cgm --help [COMMAND]
USAGE
  $ cgm COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`cgm hello PERSON`](#cgm-hello-person)
* [`cgm hello world`](#cgm-hello-world)
* [`cgm help [COMMANDS]`](#cgm-help-commands)
* [`cgm plugins`](#cgm-plugins)
* [`cgm plugins:install PLUGIN...`](#cgm-pluginsinstall-plugin)
* [`cgm plugins:inspect PLUGIN...`](#cgm-pluginsinspect-plugin)
* [`cgm plugins:install PLUGIN...`](#cgm-pluginsinstall-plugin-1)
* [`cgm plugins:link PLUGIN`](#cgm-pluginslink-plugin)
* [`cgm plugins:uninstall PLUGIN...`](#cgm-pluginsuninstall-plugin)
* [`cgm plugins:uninstall PLUGIN...`](#cgm-pluginsuninstall-plugin-1)
* [`cgm plugins:uninstall PLUGIN...`](#cgm-pluginsuninstall-plugin-2)
* [`cgm plugins update`](#cgm-plugins-update)

## `cgm hello PERSON`

Say hello

```
USAGE
  $ cgm hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/AlexejLiebenthal/codecommit-github-migrator/blob/v0.0.0/dist/commands/hello/index.ts)_

## `cgm hello world`

Say hello world

```
USAGE
  $ cgm hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ cgm hello world
  hello world! (./src/commands/hello/world.ts)
```

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.4/src/commands/help.ts)_

## `cgm plugins`

List installed plugins.

```
USAGE
  $ cgm plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ cgm plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.3.2/src/commands/plugins/index.ts)_

## `cgm plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ cgm plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ cgm plugins add

EXAMPLES
  $ cgm plugins:install myplugin 

  $ cgm plugins:install https://github.com/someuser/someplugin

  $ cgm plugins:install someuser/someplugin
```

## `cgm plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ cgm plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ cgm plugins:inspect myplugin
```

## `cgm plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ cgm plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ cgm plugins add

EXAMPLES
  $ cgm plugins:install myplugin 

  $ cgm plugins:install https://github.com/someuser/someplugin

  $ cgm plugins:install someuser/someplugin
```

## `cgm plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ cgm plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ cgm plugins:link myplugin
```

## `cgm plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ cgm plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ cgm plugins unlink
  $ cgm plugins remove
```

## `cgm plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ cgm plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ cgm plugins unlink
  $ cgm plugins remove
```

## `cgm plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ cgm plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ cgm plugins unlink
  $ cgm plugins remove
```

## `cgm plugins update`

Update installed plugins.

```
USAGE
  $ cgm plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
