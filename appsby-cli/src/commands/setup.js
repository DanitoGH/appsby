const {Command, flags} = require('@oclif/command')
const {cli} = require('cli-ux');
const chalk = require("chalk");
const boxen = require("boxen");

class SetupCommand extends Command {
  async run() {
    const {flags} = this.parse(SetupCommand)

    const greeting = chalk.white.bold("Appsby\nThe global-scale micro-framework for serverless applications\n\n©2019-2021 Audal Labs & Appsby Contributors\naudallabs.com");

    const boxenOptions = {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "yellow",
      backgroundColor: "yellow"
    };
    const msgBox = boxen( greeting, boxenOptions );

    this.log(msgBox);

    this.log("\nThis setup command will help you initialise a new Appsby app.")
    await cli.anykey()

    this.log("In order to get Appsby working, you'll need");
    await cli.wait(1500)

    this.log("- A new FaunaDB database, and an access key for 'server' role.");
    await cli.wait(4000)

    this.log("- An AWS account and an unrestricted IAM role (client/secret key set)");
    await cli.wait(4000)

    this.log("- A host that provides AWS-backed server-less functions (Appsby will easily work with AWS Lambda, Netlify Functions, Vercel Functions, and Serverless Framework)");
    await cli.wait(4000)

    this.log("- A way to store environment variables and inject them at build time (Netlify, Vercel and Serverless are all quite easy to setup this functionality with)");
    await cli.wait(4000)

    this.log("- A front-end React-based framework to build your front-end with (React/Gatsby/Next are all supported).");
    await cli.wait(10000)

    this.log("\nDo you have these decided-on/ready? Are you ready to continue?");
    await cli.anykey()


    //const name = await cli.prompt('What is your name?')

    // mask input after enter is pressed
    //const secondFactor = await cli.prompt('What is your two-factor token?', {type: 'mask'})

    // hide input while typing
    //const password = await cli.prompt('What is your password?', {type: 'hide'})
  }
}

SetupCommand.description = `Describe the command here
...
Extra documentation goes here
`

SetupCommand.flags = {
  name: flags.string({char: 'n', description: 'name to print'}),
}

module.exports = SetupCommand
