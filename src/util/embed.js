// Constants
const { MessageEmbed } = require('discord.js');

module.exports = {
    createEmbedError: function (description) {
        return new MessageEmbed()
            .setTitle('This And That | Error')
            .setColor(0xff0000)
            .setDescription(description);
    },
    createEmbedSuccess: function (description, title, footer) {
        return new MessageEmbed()
            .setTitle(`This And That | ${title}`)
            .setColor(0xffffff)
            .setDescription(description)
            .setFooter(footer);
    },
    createEmbedImage: function (description, title, footer, image) {
        return new MessageEmbed()
            .setTitle(`This And That | ${title}`)
            .setColor(0xffffff)
            .setDescription(description)
            .setFooter(footer)
            .setImage(image);
    }
}