const botConfig = require('../../config.json');
const libCommand = require('../command.js');
const libFs = require('fs');
const libFetch = require('node-fetch');
// Constants
const http = require('http');
const https = require('https');
const exec = require('child_process').exec;
const { createEmbedError, createEmbedSuccess } = require('../util/embed');

module.exports = class MReverseLinkCommand extends libCommand.Command {
    constructor() {
        super();
        // Meta Command Information
        this.internalCommandEnabled = true;
        // Help Information
        this.helpInfo = {
            title: 'Reverse Audio Search (Link)',
            description: 'Uses fingerprinting to reverse search audio files from the URL given.\nSupported File Extensions: `*.mp3`, `*.wav`, `*.m4a`',
            syntax: 'mreverselink <TOS> <URL>',
            example: 'mreverselink <TOS> https://cdn.discordapp.com/attachments/839030783758958612/839320362273210429/Local_Forecast_-_Elevator.mp3'
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
            'You must agree to the terms of service by using `&mreverselink yes <URL>`'
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
            console.log('Received link, checking attachment extension and origin...');
            let resolvedMessageFile = args[1];
            if (!resolvedMessageFile.startsWith('https://cdn.discordapp.com/attachments/')) {
                return message.channel.send(createEmbedError(
                    'An unsafe link was supplied. The bot will only accept links that are from Discord itself.'
                    + '\nValid domains: `https://cdn.discordapp.com/`'));
            }
            // Setup for downloading and checking message attachment.
            let targetDownloadFileExtension = resolvedMessageFile.substring(resolvedMessageFile.length - 3);
            let targetDownloadFile = `./cache/music/${this.uuidv4()}.` + targetDownloadFileExtension;
            // Download attachment from message.
            await this.download(resolvedMessageFile, targetDownloadFile);
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
                        })
                        .catch(() => {
                            return message.channel.send(createEmbedError('Unable to identify the audio file.'));
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