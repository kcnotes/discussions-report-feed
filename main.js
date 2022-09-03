'using strict';
const irc       = require("irc-upd");
const Discord   = require('discord.js');
const config    = require('./config.json');
const feeds     = require('./feeds.json');
const commands  = require('./commands.js');

const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
client.login(config.botToken);

// IRC
let ircClient = new irc.Client(
        config.irc.host,
        config.irc.nickname, {
            channels: [config.irc.channels.discussions],
            retryCount: 15,
            userName: config.irc.nickname,
            realName: config.irc.realname,
            debug: false,
            autoConnect: true,
            port: config.irc.port
        }
    );

/**
 * Maps wikis to feed output location
 * wiki -> Array<webhook/channel>
 * @type {Object}
 */
let wikiMap = {},
	wikis = null,
    formatMap = {};

function generateHelpCommand(cmd) {
    const params = config.commands[cmd].params.map(p => `<${p}>`);
    return `\`${prefix}${cmd}${params.length > 0 ? ' ' : ''}${params.join(' ')}\` : ${config.commands[cmd].description}`;
}

function regenerateWikiMap() {
    wikiMap = {};
    formatMap = {};
    for (let entry of Object.entries(feeds)) {
        if (('archived' in entry[1].config) && (entry[1].config.archived)) {
            continue;
        }
    	let tag = entry[0];
    	let wikis = entry[1].wikis;
    	let webhooks = entry[1].webhooks || [];
    	let channels = entry[1].channels || [];
    	for (let wiki of wikis) {
    		if (wiki in wikiMap) {
    			webhooks.forEach(wikiMap[wiki].add, wikiMap[wiki]);
    			channels.forEach(wikiMap[wiki].add, wikiMap[wiki]);
    		} else {
    			wikiMap[wiki] = new Set([...webhooks, ...channels]);
    		}
            for (const endpoint of [...webhooks, ...channels]) {
                if (endpoint in formatMap) continue;
                formatMap[endpoint] = entry[1].config;
            }
    	}
    }
    wikis = new Set(Object.keys(wikiMap));
}

regenerateWikiMap();

let overflow = '';

ircClient.addListener(`message${config.irc.channels.discussions}`, function(from, message) {
    if (message.startsWith('{')) {
        overflow = '';
    }
    if (!message.endsWith('}')) {
        overflow = `${overflow}${message}`;
        return;
    } else {
        message = `${overflow}${message}`;
    }
    try {
        // Get wiki via splitting
        let post = JSON.parse(message),
        	wiki = post.url.replace('https://', '').split(/\/f\/|\/index.php|\/wiki\/Message_Wall:/g)[0],
        	type = post.type;
        if ((type === 'discussion-report' || type === 'abuse-filter-hit') && wikis.has(wiki)) {
            for (const endpoint of Array.from(wikiMap[wiki])) {
                // Get lines to send
                let embed1 = formatMap[endpoint].showWikiInFeed ? `[${wiki}](https://${wiki}/f/reported)\n` : '';
                if (type === 'abuse-filter-hit') {
                    embed1 += `[New abuse filter hit (hit by ${post.userName})](${post.url})`;
                } else {
                    embed1 += `[New reported post (reported by ${post.userName})](${post.url})`;
                }
                let line1 = formatMap[endpoint].showWikiInFeed ? `${wiki}: ` : '';
                if (type === 'abuse-filter-hit') {
                    line1 += `Abuse filter hit by ${post.userName}: <${post.url}>`;
                } else {
                    line1 += `Report by ${post.userName}: <${post.url}>`;
                }
                let line2 = post.snippet;

                if (('displayEmbed' in formatMap[endpoint] && formatMap[endpoint].displayEmbed) || config.defaultConfig.displayEmbed) {
                    // Display an embed
                    const embed = new Discord.MessageEmbed()
                        .setDescription(embed1 + '\n' + line2)
                        .setColor('#FF285C');
                    if (endpoint.startsWith('https://')) {
                        // Embed via webhook
                        let parts = endpoint.split('/');
                        const webhookClient = new Discord.WebhookClient(parts[5], parts[6]);
                        webhookClient.send(null, {
                            embeds: [embed]
                        });
                    } else {
                        // Embed via bot
                        client.channels.cache.get(endpoint).send({
                            embed: embed
                        }).then(function (msg) {
                            msg.react("❌");
                        });
                    }
                } else {
                    // Display text only
                    if (endpoint.startsWith('https://')) {
                        let parts = endpoint.split('/');
                        const webhookClient = new Discord.WebhookClient(parts[5], parts[6]);
                        webhookClient.send(line1 + ' | ' + line2);
                    } else {
                        client.channels.cache.get(endpoint).send(line1 + ' | ' + line2)
                        .then(function(msg) {
                            msg.react("❌");
                        });
                    }
                }
            }
        }
    } catch (e) {
        console.log(e);
    }
});

// Discord
client.once('ready', () => {
    console.log(`Logged in to Discord.`);
});

const actions  = Object.keys(config.commands),
      prefix   = config.commandPrefix;

client.on('message', message => {
    let content = message.content.trim();
    if (content.startsWith(prefix)) {
        if (config.allowedConfigChannels.indexOf(message.channel.id) >= 0) {
            for (const action of actions) {
                let command = content.split(' ')[0];
                if (command === prefix + action) {
                    try {
                        let params = content.split(' ').filter(el => el != null && el != '');
                        commands[action](message, params);
                    } catch (e) {
                        console.log(e);
                        message.channel.send(`A general error occurred. Please contact Noreplyz.\nUsage: ${generateHelpCommand(action)}`);
                    }
                    regenerateWikiMap();
                    return;
                }
            }
            // If we get here, no found command
            message.channel.send(`Discussions report feed: command not found. See ${prefix}help`);
        }
    }
});

/* issues#1 Allow cross reaction to delete the message */

client.on("messageReactionAdd", async (MessageReaction, user) => {
    if (MessageReaction.partial) {
        try {
            await MessageReaction.fetch();
        } catch (error) {
            console.error(error);
            return;
        }
    }
    let message = MessageReaction.message,
    emoji = MessageReaction.emoji;
    
    if (config.allowedGuildIdReactions.includes(message.guild.id) && user.id != config.botUserId && message.author.id === config.botUserId) {
        if (emoji.name === "❌") {
            message.delete().catch(console.error);
        }
    }
});

client.on('raw', packet => {
    // We don't want this to run on unrelated packets
    if (!['MESSAGE_REACTION_ADD'].includes(packet.t)) return;
    // Grab the channel to check the message from
    const channel = client.channels.cache.get(packet.d.channel_id);
    // There's no need to emit if the message is cached, because the event will fire anyway for that
    if (channel.messages.cache.has(packet.d.message_id)) return;
    // Since we have confirmed the message is not cached, let's fetch it
    channel.messages.fetch(packet.d.message_id).then(message => {
        // Emojis can have identifiers of name:id format, so we have to account for that case as well
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
        // This gives us the reaction we need to emit the event properly, in top of the message object
        const reaction = message.reactions.cache.get(emoji);
        // Adds the currently reacting user to the reaction's users collection.
        if (reaction) reaction.users.cache.set(packet.d.user_id, client.users.cache.get(packet.d.user_id));
        // Check which type of event it is before emitting
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            client.emit('messageReactionAdd', reaction, client.users.cache.get(packet.d.user_id));
        }
    });
});