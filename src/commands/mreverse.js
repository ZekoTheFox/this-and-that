const botConfig = require('../../config.json');
const libCommand = require('../command.js');
const libFs = require('fs');
const libFetch = require('node-fetch');
// Constants
const http = require('http');
const https = require('https');
const exec = require('child_process').exec;
const { createEmbedError, createEmbedSuccess } = require('../util/embed');

module.exports = class MReverseCommand extends libCommand.Command {
    constructor() {
        super();
        // Meta Command Information
        this.internalCommandEnabled = true;
        // Help Information
        this.helpInfo = {
            title: 'Reverse Audio Search',
            description: 'Uses fingerprinting to reverse search audio files.\nSupported File Extensions: `*.mp3`, `*.wav`, `*.m4a`',
            syntax: 'mreverse <TOS> <ID>',
            example: 'mreverse <TOS> 838929937498112050'
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

    showAudioTOS() {
        return createEmbedError(
            'You must agree to the terms of service by using `&mreverse yes <ID>`'
            + '\nBy saying `yes`, you are agreeing that you will not abuse this service, and will use it willingly without any gurantees or warrenty of any kind.')
    }

    run(message, client, args) {
        console.log('Received arguments:', args);

        if (!args[0]) {
            return message.channel.send(this.showAudioTOS());
        }
        if (args[0].toLowerCase() !== 'yes') {
            return message.channel.send(this.showAudioTOS());
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
                message.channel.send(createEmbedError('An error occurred when attempting to resolve the specified message ID!\nAre you in the same channel that the ID is in?'));
                return console.log('Unable to resolve message.');
            }

            // Setup for downloading and checking message attachment.
            let resolvedMessageFile = resolvedMessage.attachments.first().name;
            let targetDownloadFileExtension = resolvedMessageFile.substring(resolvedMessageFile.length - 3);
            let targetDownloadFile = `./cache/music/${this.uuidv4()}.` + targetDownloadFileExtension;
            // Download attachment from message.
            await this.download(resolvedMessage.attachments.first().url, targetDownloadFile);
            if (targetDownloadFileExtension !== 'mp3' && targetDownloadFileExtension !== 'wav' && targetDownloadFileExtension !== 'm4a') {
                return message.channel.send(createEmbedError('An unsupported file was supplied to search. Supported file types for reverse audio searching are `*.mp3`, `*.wav`, `*.m4a`'));
            }

            exec(`fpcalc -json ${targetDownloadFile}`, (execErr, stdOut, stdErr) => {
                if (stdOut) {
                    let output = JSON.parse(stdOut);
                    let url = `https://api.acoustid.org/v2/lookup?client=${botConfig.acoustidApiKey}`
                    + `&duration=${Math.floor(output.duration)}`
                    + `&fingerprint=${output.fingerprint}`
                    + '&meta=recordings+releasegroups+compress';
                    libFetch(url)
                        .then(res => res.json())
                        .then(json => {
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

                            message.channel.send(createEmbedSuccess(
                                `**Music Title**: *${musicTitle}*`
                                + `\n**Album(s)**: *${arrayMusicAlbums.join(', ')}*`
                                + `\n**Artist(s)**: *${arrayMusicArtists.join(', ')}*`,
                                'Reverse Audio Search',
                                'Is this the right song? I can\'t really tell...'));
                        });

                    libFs.unlink(targetDownloadFile, (err) => console.error);

                    return;
                }

                console.log('Unable to execute fingerprinting for music. Deleting file...');
                libFs.unlink(targetDownloadFile, (err) => console.error);
                // Error to user
                return message.channel.send(createEmbedError('An internal error occurred trying to fingerprint the requested audio file.'));
            });
        })();
    }
}