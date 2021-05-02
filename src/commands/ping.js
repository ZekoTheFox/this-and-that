const botConfig = require('../../config.json');
const libCommand = require('../command.js');
// Constants
const { MessageEmbed } = require('discord.js');

module.exports = class ReverseCommand extends libCommand.Command {
    constructor() {
        super();
        // Meta Command Information
        this.internalCommandEnabled = true;
        this.internalCommandTriggerName = 'reverse';
        // Help Information
        this.helpCommandTitle = 'Reverse Image Search';
        this.helpCommandDescription = 'This command reverse image searches the attachment snowflake id given.\nSupported Filename Extensions: *.png, *.jpg, *.jpeg';
        this.helpCommandColor = parseInt('0x' + botConfig.botConfig.embedColor);
    }

    run(message, client) {
        
        message.channel.send(new MessageEmbed()
        .setTitle('This And That | Ping')
        .setColor(0xffffff)
        .setDescription(`Ping: ${client.ws.ping}ms`));
    }
}