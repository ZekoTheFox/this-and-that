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
        .setTitle('This And That | Donating')
        .setColor(0x00ff00)
        .setDescription('Thank you for taking notice for donating to this bot.\n\nYou can donate via my PayPal, which you can find [here](https://paypal.me/Foxyrina)!\n\nDonating helps me fund service and server costs for running this bot, and helps motivate me to continuiously improve the user experience.'));
    }
}