# This And That
Reverse Image / Audio Searching Bot for Discord

## Cache Folder
You may need to make a `./cache` folder in the extracted directory.
There are two folders in the cache folder, `./cache/images` and `./cache/music`.
If the bot doesn't work by any chance, and those folders don't exist, try making them.

## Logs Folder
Also, there needs to be a folder directory located at `./logs/api`

## Quick FAQ
### How do I use the bot?
Look at the bottom of this FAQ.
### How do I make this thing work?
You'll need a [Bing API](https://docs.microsoft.com/en-us/azure/cognitive-services/bing-web-search/) key (one of the two keys will work.), and an [AcoustID](https://acoustid.org/) API key.
You can have a look in the [`./config.example.json`](https://github.com/ZekoTheFox/this-and-that/blob/main/config.example.json) for an example of the config.
Just make sure to create the new config file under `./config.json`. (basically just remove the `.example` part)
**I won't provide any help for setting this bot up. Its up to you to figure out how to get the keys, as the fact that I linked them should be enough.**
***For any chances you do actually need help for something complicated, contact me via Discord @ `Zeko#5808`.***
### Why did you make this?
It was just a fun project I thought of making.
### Are you developing this still?
Create an issue asking me further about that. I will work on this further if people actually find this useful. (maybe even setup a private bot for select communities!)
There are a lot of things I could improve, but I don't want to work on something that I feel like no one is going to use.
### How can I help?
Two ways.
1. Create an issue regarding, well the issue you had with the bot. Simple or rhetorical issues will be closed with or without notice. (e.g. How do I make the config?)
2. [Donate to help fund a bot that you can get access to in your server!](https://paypal.me/Foxyrina) (Keep in mind that you can always self-host it if you want to! (The amazingness of OSS!))
### Why did you release this? It looks like it was a private code base before?
I released it publicly because I felt keeping it dormant and private wasn't really a good thing, so I thought of releasing it to the internet might be a good thing.
### Why is the code so messy?
Coded in like, 3-5 days (the last 2 days were just cleanup really), why what else did you expect? 
### What if I just want to have the bot to mess around with?
Create an issue, and/or contact me on Discord @ `Zeko#5808`. If you are kind enough, I'll give you access to the private bot.
Keep in mind that if development picks up again, you may see the bot peridically error or never respond, thats just the way of development.
### I have the bot now, how do I use it? / Command Documentation.
The default prefix, if you haven't changed it at least, is `&`, or the Ampersand.
The bot also has `help`, just use that if you don't want to pull up this README everytime. :P
- `ireverse <TOS> <ID>` - Reverse Image Searches the attachment linked to the ID.
- `ireverse <TOS> <URL>` - Same thing as `ireverse`, but with a URL instead of an ID.
- `more <ResponseID> <#/Number>` - Checks the next images from the Response ID. (You can find the Response ID from a reverse image search embed.)
- `mreverse <TOS> <ID>` - Reverse Audio Searches the attachment linked to the ID.
- `donate` - Just some information on how to donate to me to help fund the bot, if you do run it, or if you have access to it.
- `mreverse <TOS> <URL>` - Same thing as `mreverse`, but with a URL instead of an ID.
- `ping` - Ping from the server / computer to Discord servers.
- `help` - Shows more information about the commands. Preferrably use this instead of looking here.
