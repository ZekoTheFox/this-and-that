const botConfig = require('../../config.json');
const libCommand = require('../command.js');
const libFs = require('fs');
// Constants
const { createEmbedError, createEmbedImage } = require('../util/embed');

module.exports = class MoreCommand extends libCommand.Command {
    constructor() {
        super();
        // Meta Command Information
        this.internalCommandEnabled = true;
        // Help Information
        this.helpInfo = {
            title: 'More',
            description: 'Returns the indexed image from the Response ID and requested index number.',
            syntax: 'more <ResponseID> <index>',
            example: 'more 68dae7db-de39-41e5-a51a-b0bfbdd703a3 2'
        }
    }

    run(message, client, args) {
        console.log('Received arguments:', args);

        let requestedUuid;
        try {
            requestedUuid = args[0].match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)[0];
        } catch {
            return message.channel.send(createEmbedError('Requested Response ID not found.'));
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
                    return message.channel.send(createEmbedError('There weren\'t anymore images to look through.'));
                }

                message.channel.send(createEmbedImage(
                    `Index: ${args[1]}`
                    + `\n\n__"${validImages[args[1]].name}"__`
                    + `\n[Image Link](${validImages[args[1]].contentUrl})`,
                    'More',
                    `Queried ID: ${args[0]}`,
                    validImages[args[1]].contentUrl));
            });
        })();
    }
}