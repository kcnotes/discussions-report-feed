'using strict';
const irc       = require("irc-upd");
const Discord   = require('discord.js');
const config    = require('./config.json');
const feeds     = require('./feeds.json');
const commands  = require('./commands.js');

const client = new Discord.Client();
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
	wikis = null;

function generateHelpCommand(cmd) {
    const params = config.commands[cmd].params.map(p => `<${p}>`);
    return `\`${prefix}${cmd}${params.length > 0 ? ' ' : ''}${params.join(' ')}\` : ${config.commands[cmd].description}`;
}

function regenerateWikiMap() {
    wikiMap = {};
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
    	}
    }
    wikis = new Set(Object.keys(wikiMap));
    console.log(wikiMap, wikis);
}

regenerateWikiMap();

ircClient.addListener(`message${config.irc.channels.discussions}`, function(from, message) {
    try {
        // Get wiki via splitting
        let post = JSON.parse(message),
        	wiki = post.url.replace('https://', '').split('/f/')[0],
        	type = post.type;
        if (type === 'discussion-report' && wikis.has(wiki)) {
            console.log(wikiMap[wiki]);
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