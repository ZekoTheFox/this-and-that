const botConfig = require('../../config.json');
const libCommand = require('../command.js');
// Constants
const { MessageEmbed } = require('discord.js');

module.exports = class DonateCommand extends libCommand.Command {
    constructor() {
        super();
        // Meta Command Information
        this.internalCommandEnabled = true;
        // Help Information
        this.helpCommandTitle = 'Donations';
        this.helpCommandDescription = 'Shows donation info, about how you can donate to this bot\'s author to help fund for service and server costs.';
        this.helpCommandColor = parseInt('0x' + botConfig.botConfig.embedColor);
    }

    run(message, client) {
        
        message.channel.send(new MessageEmbed()
        .setTitle('This And That | Ping')
        .setColor(0xffffff)
        .setDescription('Thank you for taking notice for donating to this bot.'));
    }
}