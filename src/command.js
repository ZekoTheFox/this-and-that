const botConfig = require('../config.json')
const libDiscord = require('discord.js')


module.exports = {
    Command: class Command {
        constructor() {
            // Meta Command Information
            this.internalCommandEnabled = false;
            this.internalCommandTriggerName = 'null';
            // Help Information
            this.helpCommandTitle = null;
            this.helpCommandDescription = null;
            this.helpCommandColor = parseInt("0x" + botConfig.botConfig.embedColor);
        }

        helpEmbed() {
            return new libDiscord.MessageEmbed()
                .setTitle('This And That | ' + this.helpCommandTitle)
                .setColor(this.helpCommandColor)
                .setDescription(this.helpCommandDescription);
        }

        run(message) {
            // To be overidden...
        }
    }
}