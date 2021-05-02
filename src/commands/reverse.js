const botConfig = require('../../config.json');
const libCommand = require('../command.js');
const libFs = require('fs');
const libRequest = require('request');
// Constants
const { MessageEmbed } = require('discord.js');
const http = require('http');
const https = require('https');
const FormData = require('form-data');


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

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async download(url, filePath) {
        const proto = !url.charAt(4).localeCompare('s') ? https : http;

        return new Promise((resolve, reject) => {
            const file = libFs.createWriteStream(filePath);
            let fileInfo = null;

            const request = proto.get(url, response => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                    return;
                }

                fileInfo = {
                    mime: response.headers['content-type'],
                    size: parseInt(response.headers['content-length'], 10),
                };

                response.pipe(file);
            });

            // The destination stream is ended by the time it's called
            file.on('finish', () => resolve(fileInfo));

            request.on('error', err => {
                libFs.unlink(filePath, () => reject(err));
            });

            file.on('error', err => {
                libFs.unlink(filePath, () => reject(err));
            });

            request.end();
        });
    }

    run(message, client, args) {
        if (args[0].toLowerCase() !== 'yes') {
            return message.channel.send(new MessageEmbed()
                .setTitle('This And That | Error')
                .setColor(0xff0000)
                .setDescription('You must agree to the terms of service by using `&reverse yes <ID>`\nBy saying `yes`, you are agreeing that you will not abuse this service, and that you agree to Microsoft\'s [Privacy Policy](https://privacy.microsoft.com/en-us/privacystatement), as well as [Service Agreement](https://www.microsoft.com/en-us/servicesagreement/).'));
        }

        let resolvedMessage;
        console.log('Printing received arguments: ', args);
        (async () => {
            await message.channel.messages.fetch(args[1])
                .then(message => {
                    resolvedMessage = message;
                })
                .catch(err => {
                    console.error(err);
                });
            if (!resolvedMessage) {
                message.channel.send(new MessageEmbed()
                    .setTitle('This And That | Error')
                    .setColor(0xff0000)
                    .setDescription('An error occurred when attempting to resolve the specified message id!\nAre you in the same channel that the ID is in?'));
                return console.log('Unable to resolve message.');
            }
            console.log('Resolved snowflake, checking attachment extension...');
            let uuidFileNameExtension = resolvedMessage.attachments.first().name.split('.')[1];
            if (uuidFileNameExtension === 'png' || uuidFileNameExtension === 'jpg' || uuidFileNameExtension === 'jpeg') {
                // TODO: Add file size limit
                console.log('Passed extension check.');
                // Generate a unique name first.
                let uuidFileName = this.uuidv4();
                let uuidFile = './cache/' + uuidFileName + '.' + uuidFileNameExtension;
                // Download the image
                await this.download(resolvedMessage.attachments.first().url, uuidFile);

                let form = new FormData();
                form.append('image', libFs.createReadStream(uuidFile));
                form.getLength((err, length) => {
                    if (err)
                        return requestCallback(err);
                    var r = libRequest.post(botConfig.bingApiEndpoint, (err, res, body) => {
                        console.log(JSON.stringify(JSON.parse(body), null, '  '));
                        console.log('Found image. Sending response...')
                        let responseData = JSON.parse(body);
                        let imageData = responseData.tags[0].actions.filter(e => e.actionType === 'VisualSearch')[0].data.value;
                        message.channel.send(new MessageEmbed()
                            .setTitle('This And That | Reverse Image Search')
                            .setColor(0xffffff)
                            .setDescription(`I found ${imageData.length} or more images. Showing the top-most image returned...\n\n__"${imageData[0].name}"__\n[${imageData[0].contentUrl}](${imageData[0].contentUrl})`)
                            .setImage(imageData[0].contentUrl));

                        libFs.unlink(uuidFile, (err) => {
                            if (err)
                                console.err(err);
                        });
                        console.log('Deleted requested file.');
                    });
                    r._form = form;
                    r.setHeader('Ocp-Apim-Subscription-Key', botConfig.bingApiKey);
                });

                // let creditentials = new CognitiveServicesCredentials(botConfig.bingApiKey);
                // let searchClient = new libSearch.VisualSearchClient(creditentials, { endpoint: botConfig.bingApiEndpoint });
                // let fileStream;
                // await libFs.readFile(uuidFile, (err, data) => {
                //     fileStream = data;
                // })
                // let searchRequest = JSON.stringify({});
                // let searchResults;

                // try {
                //     searchResults = await searchClient.images.visualSearch({
                //         image: fileStream,
                //         knowledgeRequest: searchRequest
                //     });

                //     console.log(`Searching images with binary of requested image: ${uuidFile}`);
                // } catch (err) {
                //     console.log('Encountered exception: ' + err.message);
                //     console.error(err);
                // }

                // if (searchResults.image.imageInsightsToken) {
                //     console.log(`Uploaded image token: ${searchResults.image.imageInsightsToken}`);
                // } else {
                //     console.log('Couldn\'t find image token!');
                // }

                // if (searchResults.tags.length > 0) {
                //     let firstTagResult = searchResults.tags[0];
                //     console.log(`Visual search tag count: ${searchResults.tags.length}`);
                //     console.log('OUTPUTTING RAW DATA!!! ------------------------------------------------------------');
                //     console.log(searchResults.tags);
                //     console.log('DONE!!! ---------------------------------------------------------------------------');

                //     if (firstTagResult.actions.length > 0) {
                //         let firstActionResult = firstTagResult.actions[0];
                //         console.log(`First tag action count: ${firstTagResult.actions.length}`);
                //         console.log(`First tag action type: ${firstActionResult.actionType}`);
                //     }
                //     else {
                //         console.log('Couldn\'t find tag actions!');
                //     }

                // }
                // else {
                //     console.log('Couldn\'t find image tags!');
                // }

            }

        })();
    }
}