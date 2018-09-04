# bPanel CLI
A simple CLI utility for use with bpanel

## Installation
```
npm install -g @bpanel/bpanel-cli
```

## Usage
Passing no arguments, or `--help`, will return the help menu.

```bash
$bpanel-cli --help
```

Currently supports:

- `create` / `c`: create a plugin boilerplate project for local development
- `list` / `l`: list all currently installed plugins
- `install` / `i`: install a new plugin to your local bPanel
- `uninstall` / `u`: uninstall a plugin from your local bPanel
- `search` / `s`: search available plugins you can install with `bpanel-cli i`

## Create a Plugin Boilerplate
The `create` command will walk you through the steps to create a plugin boilerplate.

In your terminal:
```
bpanel-cli create
```

Then just answer the questions. The initial questions will setup your
[bPanel metadata](http://bcoin.io/bpanel-docs/docs/api-metadata.html),
as well as necessary information to initialize your project as an npm module.
This means that when you're happy with your plugin and want to share it with the world, all you have to do is run `npm publish` from your project directory.

Most of the questions are self-explanatory, but if this is your first time creating a bPanel plugin some additional information might be helpful.

### Names
The first question is about primary name of your plugin. This will set the name of your directory and the name of your plugin on npm.
Because npm uses package names in the registry's url, only url friendly names can be used. We use [`validate-npm-package-name`](https://www.npmjs.com/package/validate-npm-package-name) to validate names, so you can see their readme for specific rules. If there's anything wrong, you will be asked to pick a new name. **This does not check for the existence of an npm package with the same name**, so double check this on your own first.

You can learn more about plugin names [here](http://bcoin.io/bpanel-docs/docs/api-metadata.html#details.

### Dependency Check
The question "Will your plugin depend on any other published bPanel plugins" has to do with whether you will be bundling or requiring any other bPanel compliant plugins (i.e. they must follow the [API rules](http://bcoin.io/bpanel-docs/docs/plugin-started.html#the-plugin-api)). You can read more about plugin bundling [here](http://bcoin.io/bpanel-docs/docs/api-bundling-plugins.html).

To see what plugins are available to be bundled run the following in another terminal:

```bash
$ bpanel-cli search
```

This will search the npm registry for any plugins tagged with the `bpanel` keyword (all plugins created with `bpanel-cli` will automatically add this keyword).

### Making a Theme
You can read more about making a theme in bPanel [here](http://bcoin.io/bpanel-docs/docs/theming-started.html). If you answer "y" to this, `bpanel-cli` will mock out the necessary files and exports to create a theme.

### Additional Modules
By default, `bpanel-cli` will only expose the `metadata` export from the entry point of your app. If you have a good idea of what you want to start building, you can choose "y" to the question of _"Would you like to add any additional module templates"_.
This will mock out in your `lib/index.js` what these modules should look like.

Scroll through the options with your arrow keys (or vim navigation), select with the space bar, and press enter when you're done.

If any of the modules selected need to specify a component
they will decorate (e.g. Footer, Header, Sidebar, or Panel),
you will be asked to select which in the next step. You can add more later.

To learn more about building plugins and about the module API, check out the [bPanel documentation website](http://bcoin.io/bpanel-docs).

## License

- Copyright (c) 2018, Bcoin Devs (MIT License).

See LICENSE for more info.