const botConfig = require('../../config.json');
const libCommand = require('../command.js');
// Constants
const { MessageEmbed } = require('discord.js');
const { createEmbedSuccess } = require('../util/embed');

module.exports = class DonateCommand extends libCommand.Command {
    constructor() {
        super();
        // Meta Command Information
        this.internalCommandEnabled = true;
        // Help Information
        this.helpInfo = {
            title: 'Donate',
            description: 'Shows information on how to donate to this bot\'s owner, and how you can help fund its development.',
            syntax: 'donate',
            example: 'donate'
        }
    }

    run(message, client) {
        message.channel.send(createEmbedSuccess(
            'Thank you for taking notice for donating to this bot.'
            + '\n\nYou can donate via my PayPal, which you can find [here](https://paypal.me/Foxyrina)!'
            + '\n\nDonating helps me fund this service and covers server costs as well as API requests for running this bot, and helps motivate me to continuiously improve the user experience.',
            'Donate',
            'Thanks in advance if you do donate. I really appreciate it!'));
    }
}