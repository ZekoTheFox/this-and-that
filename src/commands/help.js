const botConfig = require('../../config.json');
const libCommand = require('../command.js');
const libFs = require('fs');
// Constants
const { createEmbedSuccess } = require('../util/embed');

module.exports = class HelpCommand extends libCommand.Command {
    constructor() {
        super();
        // Meta Command Information
        this.internalCommandEnabled = true;
        // Help Information
        this.helpInfo = {
            title: 'Help',
            description: 'Displays this help page.',
            syntax: 'help',
            example: 'help'
        }
    }

    run(message, client) {
        libFs.readdir('./src/commands/', (err, files) => {
            let commandList = [];
            files.forEach(element => {
                const command = require(`./${element}`);
                commandList.push((new command()).helpInfo);
            });
            const prefix = botConfig.botConfig.prefix;
            let assembledHelpString = [];
            commandList.forEach(element => {
                assembledHelpString.push(`__${element.title}__`
                + `\n${element.description}`
                + `\nSyntax: \`${prefix}${element.syntax}\``
                + `\nExample: \`${prefix}${element.example}\``);
            });
            message.channel.send(createEmbedSuccess(
            `The bot's current prefix is: \`${prefix}\``
            + `\n${assembledHelpString.join('\n\n')}`,
            'Help',
            `Please remember, this bot isn't free to run! Please see **${prefix}donate** for more infomation.`));
        });
    }
}