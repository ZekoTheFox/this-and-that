const botConfig = require('../../config.json');
const libCommand = require('../command.js');
const libFs = require('fs');
// Constants
const { MessageEmbed } = require('discord.js');

module.exports = class MoreCommand extends libCommand.Command {
    constructor() {
        super();
        // Meta Command Information
        this.internalCommandEnabled = true;
        // Help Information
        this.helpCommandTitle = 'More';
        this.helpCommandDescription = 'Sends the next best image from a request id.';
        this.helpCommandColor = parseInt('0x' + botConfig.botConfig.embedColor);
    }

    run(message, client, args) {
        console.log('Received arguments:', args);

        let requestedUuid;
        try {
            requestedUuid = args[0].match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)[0];
        } catch {
            return message.channel.send(new MessageEmbed()
                .setTitle('This And That | Error')
                .setColor(0xff0000)
                .setDescription('Requested Response ID not found.'));
        }

        console.log(`Found UUID: ${requestedUuid}`);


        // IIALF
        (async () => {
            libFs.readFile(`./logs/api/${requestedUuid}.json`, (err, data) => {
                // Gather data from logged response.
                let responseData = JSON.parse(libFs.readFileSync(`./logs/api/${requestedUuid}.json`));
                let imageData = responseData.tags[0].actions.filter(e => e.actionType === 'VisualSearch')[0].data.value;
                // Filter images down to ones that are actual images and not anything else.
                let validImages = imageData.filter(element => element.encodingFormat !== undefined);
                if (parseInt(args[1]) > validImages.length) {
                    return message.channel.send(new MessageEmbed()
                        .setTitle('This And That | Error')
                        .setColor(0xff0000)
                        .setDescription('There weren\'t anymore images to look through.'));
                }

                message.channel.send(new MessageEmbed()
                    .setTitle('This And That | More')
                    .setColor(0xffffff)
                    .setImage(validImages[args[1]].contentUrl)
                    .setDescription(`Index: ${args[1]}` +
                        `\n\n__"${validImages[args[1]].name}"__` +
                        `\n\n[Image Link](${validImages[args[1]].contentUrl})`)
                    .setFooter(`Queried ID: ${args[0]}`));
            });
        })();
    }
}