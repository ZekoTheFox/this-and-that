const libCommand = require('../command.js');
// Constants
const { createEmbedSuccess } = require('../util/embed');

module.exports = class PingCommand extends libCommand.Command {
    constructor() {
        super();
        // Meta Command Information
        this.internalCommandEnabled = true;
        // Help Information
        this.helpInfo = {
            title: 'Ping',
            description: 'Ping from Discord to this bot.',
            syntax: 'ping',
            example: 'ping'
        }
    }

    run(message, client) {
        message.channel.send(createEmbedSuccess(`Ping: ${client.ws.ping}ms`, 'Ping', 'No clue why you need this though...'));
    }
}