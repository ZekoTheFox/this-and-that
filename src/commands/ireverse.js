const botConfig = require('../../config.json');
const libCommand = require('../command.js');
const libFs = require('fs');
const libRequest = require('request');
// Constants
const http = require('http');
const https = require('https');
const FormData = require('form-data');
const { createEmbedError, createEmbedImage } = require('../util/embed');


module.exports = class IReverseCommand extends libCommand.Command {
    constructor() {
        super();
        // Meta Command Information
        this.internalCommandEnabled = true;
        // Help Information
        this.helpInfo = {
            title: 'Reverse Image Search (ID)',
            description: 'Reverse image searches the attachment from the ID given.\nSupported Filename Extensions: `*.png`, `*.jpg`, `*.jpeg`, `*.gif`',
            syntax: 'ireverse <TOS> <ID>',
            example: 'ireverse <TOS> 838366042727383041'
        }
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

    showImageTOS() {
        return createEmbedError(
            'You must agree to the terms of service by using `&ireverse yes <ID>`'
            + '\nBy saying `yes`, you are agreeing that you will not abuse this service, and will use it willingly without any gurantees or warrenty of any kind.'
            + '\nUsing this command also requires that you agree to Microsoft\'s [Privacy Policy](https://privacy.microsoft.com/en-us/privacystatement), as well as [Service Agreement](https://www.microsoft.com/en-us/servicesagreement/).');
    }

    run(message, client, args) {
        console.log('Received arguments:', args);

        if (!args[0]) {
            return message.channel.send(this.showImageTOS());
        }
        if (args[0].toLowerCase() !== 'yes') {
            return message.channel.send(this.showImageTOS());
        }

        (async () => {
            let resolvedMessage;
            await message.channel.messages.fetch(args[1])
                .then(message => {
                    resolvedMessage = message;
                })
                .catch(err => {
                    console.error(err);
                });
            if (!resolvedMessage) {
                message.channel.send(createEmbedError(
                    'An error occurred when attempting to resolve the specified message ID!'
                    + '\nAre you in the same channel that the ID is in?'));
                return console.log('Unable to resolve message.');
            }
            console.log('Resolved snowflake, checking attachment extension...');
            let resolvedMessageFile = resolvedMessage.attachments.first().name;
            let targetDownloadFileExtension = resolvedMessageFile.substring(resolvedMessageFile.length - 4);
            let uuidFileNameExtension = targetDownloadFileExtension.startsWith('.') ? targetDownloadFileExtension.substring(1) : targetDownloadFileExtension;
            if (uuidFileNameExtension !== 'png' && uuidFileNameExtension !== 'jpg' && uuidFileNameExtension !== 'jpeg' && uuidFileNameExtension !== 'gif') {
                return message.channel.send(createEmbedError('No file, or an unsupported file was linked to the ID.'));
            }
            console.log('Passed extension check.');
            // Generate a unique name first.
            let uuidFileName = this.uuidv4();
            let uuidFile = `./cache/images/${uuidFileName}.${uuidFileNameExtension}`;
            // Download the image
            await this.download(resolvedMessage.attachments.first().url, uuidFile);

            if (libFs.statSync(uuidFile)['size'] > 1024 * 1000)
                return message.channel.send(createEmbedError('The file / attachment is too large to reverse image search. Try downscaling or cropping the image. (Max file size is 1MB, sowwy...)'));

            let form = new FormData();
            form.append('image', libFs.createReadStream(uuidFile));
            form.getLength((err, length) => {
                if (err)
                    return requestCallback(err);
                var r = libRequest.post(botConfig.bingApiEndpoint, (err2, res, body) => {
                    // console.log(JSON.stringify(JSON.parse(body), null, '  '));
                    // Log responsed data
                    libFs.writeFileSync(`./logs/api/${uuidFileName}.json`, body);
                    console.log('Found image. Sending response...')
                    let responseData = JSON.parse(body);
                    let foundPagesIncluding = true;
                    let imageData;
                    try {
                        imageData = responseData.tags[0].actions.filter(e => e.actionType === 'PagesIncluding')[0].data.value;
                    } catch {
                        foundPagesIncluding = false;
                    }
                    if (foundPagesIncluding === false || imageData.length < 1) {
                        try {
                            imageData = responseData.tags[0].actions.filter(e => e.actionType === 'VisualSearch')[0].data.value;
                        } catch {
                            return message.channel.send(createEmbedError('No results for the requested image was found.'));
                        }
                    }
                    // console.log('imageData =', imageData);
                    let validImages = [];
                    imageData.forEach(element => {
                        let elementType = element.encodingFormat;
                        if (!(elementType)) {
                            return;
                        }
                        if (elementType === 'png' || elementType === 'jpg' || elementType === 'jpeg') {
                            validImages.push(element);
                        }
                    });
                    if (validImages.length < 1) {
                        return message.channel.send(createEmbedError('No results for the requested image was found.'));
                    }
                    message.channel.send(createEmbedImage(
                        `I found ${validImages.length} ${foundPagesIncluding ? 'pages including that image.' : 'pages with a similar image(s)'}. Showing the top-most image returned...`
                        + `\n\n__"${validImages[0].name}"__\n[Image Link](${validImages[0].contentUrl})`,
                        'Reverse Image Search',
                        `Response ID: ${uuidFileName}`,
                        validImages[0].contentUrl));

                    libFs.unlink(uuidFile, (err) => {
                        if (err)
                            console.err(err);
                    });
                    console.log('Deleted requested file.');
                });
                r._form = form;
                r.setHeader('Ocp-Apim-Subscription-Key', botConfig.bingApiKey);
            });


        })();
    }
}