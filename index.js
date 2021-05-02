// Bot Invite Link:
// https://discord.com/oauth2/authorize?client_id=739647878296895590&scope=bot&permissions=34816

// Include config
const botConfig = require('./config.json');

// Auth to Discord

const libDiscord = require('discord.js');
const { MessageEmbed } = require('discord.js');
const libFs = require('fs');
const botClient = new libDiscord.Client();

botClient.on('ready', () => {
    console.log(`Logged in as ${botClient.user.tag}!`);
});

botClient.on('message', msg => {
    if (msg.content.startsWith(botConfig.botConfig.prefix)) {
        libFs.readdir('./src/commands/', (err, files) => {
            let ranCommand = false;
            files.forEach(element => {
                const tmpCommandInput = msg.content.replace(botConfig.botConfig.prefix, '').split(' ')[0];
                if (tmpCommandInput === element.split('.')[0]) {
                    const tmpCommand = require(`./src/commands/${element}`);
                    const argumentsSplit = msg.content.split(' ');
                    let args = [];
                    for (let index = 1; index < argumentsSplit.length; index++) {
                        args.push(argumentsSplit[index]);
                    }
                    try {
                        let executeCommand = new tmpCommand();
                        if (executeCommand.internalCommandEnabled)
                            executeCommand.run(msg, botClient, args);
                    } catch (err) {
                        msg.channel.send(new MessageEmbed()
                            .setTitle('This And That | Error')
                            .setColor(0xff0000)
                            .setDescription('An error occurred trying to process the command!'));
                        console.log('Error in processing command!');
                        console.error(err);
                    }
                    ranCommand = true;
                }
            });
            if (ranCommand === false) {
                msg.channel.send(new MessageEmbed()
                    .setTitle('This And That | Error')
                    .setColor(0xff0000)
                    .setDescription('Unknown command!'));
            }
        });
    }
});

botClient.login(botConfig.discordToken);