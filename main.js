'using strict';
const irc       = require("irc-upd");
const config    = require('./config.json');
const feeds     = require('./feeds.json');

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

function regenerateWikiMap() {
    for (let entry of Object.entries(feeds)) {
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
