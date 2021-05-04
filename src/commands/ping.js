const botConfig = require('../../config.json');
const libCommand = require('../command.js');
// Constants
const { MessageEmbed } = require('discord.js');

module.exports = class PingCommand extends libCommand.Command {
    constructor() {
        super();
        // Meta Command Information
        this.internalCommandEnabled = true;
        // Help Information
        this.helpCommandTitle = 'Ping';
        this.helpCommandDescription = 'Ping from Discord to this bot.';
        this.helpCommandColor = parseInt('0x' + botConfig.botConfig.embedColor);
    }

    run(message, client) {
        message.channel.send(new MessageEmbed()
            .setTitle('This And That | Ping')
            .setColor(0xffffff)
            .setDescription(`Ping: ${client.ws.ping}ms`));
    }
}