'use strict';

const botConfig = require('../../config.json');
const libCommand = require('../command.js');
const libFs = require('fs');
const libPixelmatch = require('pixelmatch');
// Constants
const { Converter } = require('ffmpeg-stream');
const { MessageEmbed } = require('discord.js');
const PNG = require('pngjs').PNG;
const http = require('http');
const https = require('https');
const sizeOf = require('image-size');
const exec = require('child_process').exec;

module.exports = class DiffCommand extends libCommand.Command {
    constructor() {
        super();
        // Meta Command Information
        this.internalCommandEnabled = false;
        // Help Information
        this.helpCommandTitle = 'Diff';
        this.helpCommandDescription = 'Tries to apply a difference operation to the requested image and previous response images to find the best result.';
        this.helpCommandColor = parseInt('0x' + botConfig.botConfig.embedColor);
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
        console.log('Received arguments:', args);

        let requestedUuid = args[0];

        console.log(`Found UUID: ${requestedUuid}`);

        // Attempt to parse comparsion limit, otherwise default to 1.
        let comparingLimit = 1;
        console.log('Parsing comparsion limit...');
        try {
            comparingLimit = parseInt(args[2]);
        } catch (err) {
            message.channel.send(new MessageEmbed()
                .setTitle('This And That | Error')
                .setColor(0xff0000)
                .setDescription('The comparison limit argument was unable to be parsed.'));
        }

        // Check if the config is less that the requested limit.
        const configComparingLimit = botConfig.botConfig.maximumComparisonLimit;
        if (comparingLimit > configComparingLimit) {
            message.channel.send(new MessageEmbed()
                .setTitle('This And That | Error')
                .setColor(0xff0000)
                .setDescription(`The comparison limit maximum is currently set to \`${configComparingLimit}\`.`));
        }

        // Make an array to mark files for deletion.
        let filesToDelete = [];

        // IIALF
        (async () => {
            // Setup for resolving target message.
            let resolvedMessage;
            // Resolve message.
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
                    .setDescription('An error occurred when attempting to resolve the specified message ID!\nAre you in the same channel that the ID is in?'));
                return console.log('Unable to resolve message.');
            }


            // Setup for downloading and checking message attachment.
            let targetDownloadFileExtension = resolvedMessage.attachments.first().name.split('.')[1];
            let targetDownloadFile = `./cache/download/${requestedUuid}.` + targetDownloadFileExtension;
            // Download attachment from message.
            await this.download(resolvedMessage.attachments.first().url, targetDownloadFile);
            if (targetDownloadFileExtension !== 'png' && targetDownloadFileExtension !== 'jpg' && targetDownloadFile !== 'jpeg') {
                return message.channel.send(new MessageEmbed()
                    .setTitle('This And That | Error')
                    .setColor(0xff0000)
                    .setDescription('An unsupported file was supplied to compare against. Supported file types for comparing are `*.png`, `*.jpg`, `*.jpeg'));
            }

            // Width and height
            await sizeOf(targetDownloadFile, async (err, dim) => {
                // Push to deletion array
                filesToDelete.push(targetDownloadFile);

                // Create converter.
                const converter = new Converter();
                const converterInput = converter.createInputStream({
                    f: 'image2pipe'
                });
                libFs.createReadStream(targetDownloadFile).pipe(converterInput);

                const converterOutput = converter.createOutputStream({
                    f: 'image2',
                    vf: `scale=${dim.width}:${dim.height}`
                });
                let convertedImage = `./cache/converted/${requestedUuid}.png`;
                converterOutput.pipe(libFs.createWriteStream(convertedImage));

                console.log('Converting target image...');
                // Run target image converter.
                await converter.run();

                // Push to deletion array.
                filesToDelete.push(convertedImage);

                let finishedConversion = false;

                // Array for storing files we'll delete later.
                let filesDownloaded = [];
                // Start reading logged response.
                libFs.readFile(`./logs/api/${requestedUuid}.json`, (err, data) => {
                    // Gather data from logged response.
                    let responseData = JSON.parse(libFs.readFileSync(`./logs/api/${requestedUuid}.json`));
                    let imageData = responseData.tags[0].actions.filter(e => e.actionType === 'VisualSearch')[0].data.value;
                    // Filter images down to ones that are actual images and not anything else.
                    let validImages = imageData.filter(element => element.encodingFormat !== undefined);
                    // Comment later...
                    // console.log(validImages);
                    // Create array for collecting valid images.
                    let collectedValidImages = [];
                    // Loop through the validImages array and add them to collectedValidImages.
                    for (let index = 0; index < (comparingLimit < validImages.length ? comparingLimit : validImages.length); index++) {
                        collectedValidImages.push(validImages[index]);
                    }
                    // Start downloading the images to the cache's download folder.
                    for (let index = 0; index < collectedValidImages.length; index++) {
                        let tmpDir = `./cache/download/${requestedUuid}_${index}.${collectedValidImages[index].encodingFormat}`;
                        let downloadedFile = false;
                        try {
                            (async () => {
                                await this.download(collectedValidImages[index].contentUrl, tmpDir);
                            })();
                            downloadedFile = true;
                        } catch (urlErr) {
                            console.log('Failed to download an image, skipping...');
                        }
                        if (downloadedFile) {
                            filesDownloaded.push(tmpDir);
                            console.log(`Downloaded file: ${tmpDir}`);
                        }
                    }
                    // Setup for later
                    let convertedFiles = [];
                    // Start converting the downloaded images.
                    for (let index = 0; index < filesDownloaded.length; index++) {
                        const tmpConverter = new Converter();
                        const tmpDownloadedUnconverted = tmpConverter.createInputStream({
                            f: 'image2pipe'
                        });
                        libFs.createReadStream(filesDownloaded[index]).pipe(tmpDownloadedUnconverted);
                        let tmpDownloadedFile = `./cache/converted/${requestedUuid}_${index}.png`;
                        tmpConverter.createOutputStream({
                            f: 'image2',
                            vf: `scale=${dim.width}:${dim.height}`
                        }).pipe(libFs.createWriteStream(tmpDownloadedFile));
                        // Run converter.
                        (async () => {
                            await tmpConverter.run();
                        })();
                        // Push to convertedFiles array.
                        convertedFiles.push(tmpDownloadedFile);

                        console.log(`Converted ${tmpDownloadedFile}!`);
                        // Mark every converted file for deletion.
                        filesToDelete.push(tmpDownloadedFile);

                        if (index >= filesDownloaded.length)
                            finishedConversion = true;
                    }
                    // Mark every downloaded file for deletion.
                    filesToDelete = filesToDelete.concat(filesDownloaded);

                    console.log(convertedFiles);

                    // Set highest confidence structure.
                    let highestConfidence = {
                        "confidence": 0.0,
                        "imageLink": "null"
                    }
                    let totalPixelsCounted = dim.width * dim.height;
                    let outputDiff = new PNG({ width: dim.width, height: dim.height });
                    for (let index = 0; index < convertedFiles.length; index++) {
                        // let currentBuffer = libFs.readFileSync(element);
                        // libPixelmatch(targetImageFile.data, targetPNGObject.data, outputDiff.data, dim.width, dim.height, { threshold: 0.125 });
                        exec(`node ./src/util/pixelmatch.js ${convertedImage} ${convertedFiles[index]} ./cache/diff/diff_${index}.png 0.08`, (execErr, stdOut, stdErr) => {
                            if (execErr)
                                console.error(execErr);
                        });

                        exec(`node ./src/util/find.js ${highestConfidence.confidence} ./cache/diff/diff_${index}.png`, (execErr, stdOut, stdErr) => {
                            if (stdOut !== "") {
                                highestConfidence = {
                                    "confidence": parseFloat(stdOut).toFixed(2),
                                    "imageLink": collectedValidImages[parseInt(convertedFiles[index].split('_')[1].split('.')[0])].contenturl
                                }
                            }
                        });
                    }

                    message.channel.send(new MessageEmbed()
                        .setTitle('This And That | Difference')
                        .setColor(0xffffff)
                        .setDescription(`I am ${highestConfidence.confidence}% confident that this is very similar to the target image.` +
                            `\n\n[Image Link](${highestConfidence.imageLink})`) /**/);
                    //.setImage(highestConfidence.imageLink));
                });
            });
        })();
    }
}