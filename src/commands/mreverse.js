const botConfig = require('../../config.json');
const libCommand = require('../command.js');
const libFs = require('fs');
const libFetch = require('node-fetch');
// Constants
const { MessageEmbed } = require('discord.js');
const http = require('http');
const https = require('https');
const exec = require('child_process').exec;

module.exports = class MReverseCommand extends libCommand.Command {
    constructor() {
        super();
        // Meta Command Information
        this.internalCommandEnabled = true;
        // Help Information
        this.helpCommandTitle = 'Reverse Audio Search';
        this.helpCommandDescription = 'Uses fingerprinting to reverse search audio files.';
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
        console.log('Received arguments:', args);

        if (args[0]) {
            if (args[0].toLowerCase() !== 'yes') {
                return message.channel.send(new MessageEmbed()
                    .setTitle('This And That | Error')
                    .setColor(0xff0000)
                    .setDescription('You must agree to the terms of service by using `&reverse yes <ID>`\nBy saying `yes`, you are agreeing that you will not abuse this service, and will use it willingly without any gurantees or warrenty of any kind.'));
            }
        } else {
            return message.channel.send(new MessageEmbed()
                .setTitle('This And That | Error')
                .setColor(0xff0000)
                .setDescription('You must agree to the terms of service by using `&reverse yes <ID>`\nBy saying `yes`, you are agreeing that you will not abuse this service, and will use it willingly without any gurantees or warrenty of any kind.'));
        }

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
            let resolvedMessageFile = resolvedMessage.attachments.first().name;
            let targetDownloadFileExtension = resolvedMessageFile.substring(resolvedMessageFile.length - 3);
            let targetDownloadFile = `./cache/music/${this.uuidv4()}.` + targetDownloadFileExtension;
            // Download attachment from message.
            await this.download(resolvedMessage.attachments.first().url, targetDownloadFile);
            if (targetDownloadFileExtension !== 'mp3' && targetDownloadFileExtension !== 'wav' && targetDownloadFileExtension !== 'm4a') {
                return message.channel.send(new MessageEmbed()
                    .setTitle('This And That | Error')
                    .setColor(0xff0000)
                    .setDescription('An unsupported file was supplied to search. Supported file types for reverse audio searching are `*.mp3`, `*.wav`, `*.m4a`'));
            }

            exec(`fpcalc -json ${targetDownloadFile}`, (execErr, stdOut, stdErr) => {
                if (stdOut) {
                    let output = JSON.parse(stdOut);
                    let url = `https://api.acoustid.org/v2/lookup?client=${botConfig.acoustidApiKey}&duration=${Math.floor(output.duration)}&meta=recordings+releasegroups+compress&fingerprint=${output.fingerprint}`;
                    // console.log(url);
                    libFetch(url)
                        .then(res => res.json())
                        .then(json => {
                            // console.log(json);
                            let musicTitle = json.results[0].recordings[0].title;
                            let musicAlbums = json.results[0].recordings[0].releasegroups;
                            let musicArtists = json.results[0].recordings[0].artists;
                            let arrayMusicAlbums = [];
                            let arrayMusicArtists = [];

                            musicAlbums.forEach(element => {
                                arrayMusicAlbums.push(element.title)
                            });
                            musicArtists.forEach(element => {
                                arrayMusicArtists.push(element.name);
                            })

                            message.channel.send(new MessageEmbed()
                                .setTitle('This And That | Reverse Audio Search')
                                .setColor(0xffffff)
                                .setDescription(`**Music Title**: *${musicTitle}*\n`
                                    + `**Album(s)**: *${arrayMusicAlbums.join(', ')}*\n`
                                    + `**Artist(s)**: *${arrayMusicArtists.join(', ')}*`));
                        });

                    libFs.unlink(targetDownloadFile, (err) => console.error);

                    return;
                }

                console.log('Unable to execute fingerprinting for music. Deleting file...');
                libFs.unlink(targetDownloadFile, (err) => console.error);
                // Error to user
                return message.channel.send(new MessageEmbed()
                    .setTitle('This And That | Error')
                    .setColor(0xff0000)
                    .setDescription('An internal error occurred trying to fingerprint the requested audio file.'));
            });
        })();

        // let requestedUuid;
        // try {
        //     requestedUuid = args[0].match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)[0];
        // } catch {
        //     return message.channel.send(new MessageEmbed()
        //         .setTitle('This And That | Error')
        //         .setColor(0xff0000)
        //         .setDescription('Requested Response ID not found.'));
        // }

        // console.log(`Found UUID: ${requestedUuid}`);


        // // IIALF
        // (async () => {
        //     libFs.readFile(`./logs/api/${requestedUuid}.json`, (err, data) => {
        //         // Gather data from logged response.
        //         let responseData = JSON.parse(libFs.readFileSync(`./logs/api/${requestedUuid}.json`));
        //         let imageData = responseData.tags[0].actions.filter(e => e.actionType === 'VisualSearch')[0].data.value;
        //         // Filter images down to ones that are actual images and not anything else.
        //         let validImages = imageData.filter(element => element.encodingFormat !== undefined);
        //         if (parseInt(args[1]) > validImages.length) {
        //             return message.channel.send(new MessageEmbed()
        //                 .setTitle('This And That | Error')
        //                 .setColor(0xff0000)
        //                 .setDescription('There weren\'t anymore images to look through.'));
        //         }

        //         message.channel.send(new MessageEmbed()
        //             .setTitle('This And That | More')
        //             .setColor(0xffffff)
        //             .setImage(validImages[args[1]].contentUrl)
        //             .setDescription(`Index: ${args[1]}` +
        //                 `\n\n__"${validImages[args[1]].name}"__` +
        //                 `\n[Image Link](${validImages[args[1]].contentUrl})`)
        //             .setFooter(`Queried ID: ${args[0]}`));
        //     });
        // })();
    }
}