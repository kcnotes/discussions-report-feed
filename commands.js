'using strict';

commands = {};
const config    = require('./config.json');
const feeds     = require('./feeds.json');
const fs        = require('fs');

function generateHelpCommand(cmd) {
    const params = config.commands[cmd].params.map(p => `<${p}>`),
          prefix = config.commandPrefix;
    return `\`${prefix}${cmd}${params.length > 0 ? ' ' : ''}${params.join(' ')}\` : ${config.commands[cmd].description}`;
}

function saveFeeds() {
    fs.writeFileSync('feeds.json', JSON.stringify(feeds, null, 4), 'utf8');
}

/**
 * Check the param count is between lo and hi
 * @param  {Discord.Message} message Discord message
 * @param  {Array<String>}   params  Parameters
 * @param  {String}          cmd     Command name
 * @param  {Number}          lo      lower amount
 * @param  {Number}          hi      higher amount
 * @return {Boolean}                 Whether param is good or not
 */
function checkParamCount(message, params, cmd, lo, hi) {
    if (lo && hi) {
        if (params.length - 1 < lo || params.length - 1 > hi) {
            message.channel.send(`Usage: ${generateHelpCommand(cmd)}`);
            return false;
        }
        return true;
    } else if (lo) {
        if (params.length - 1 < lo) {
            message.channel.send(`Usage: ${generateHelpCommand(cmd)}`);
            return false;
        }
        return true;
    } else if (hi) {
        if (params.length - 1 > hi) {
            message.channel.send(`Usage: ${generateHelpCommand(cmd)}`);
            return false;
        }
        return true;
    } else {
        return true;
    }
}

var languages = ['de', 'en', 'es', 'fr', 'it', 'ja', 'pl', 'pt-br', 'ru', 'zh', 'zh-tw', 'aa', 'ab', 'ace',
    'af', 'ak', 'aln', 'am', 'anp', 'ar', 'arc', 'arn', 'ary', 'arz', 'as', 'av', 'avk', 'ay', 'az', 'ba', 'bat-smg',
    'bcc', 'bcl', 'be', 'be-tarask', 'be-x-old', 'bg', 'bh', 'bho', 'bi', 'bjn', 'bm', 'bn', 'bo', 'bpy', 'bqi', 'br',
    'brh', 'bs', 'bug', 'bxr', 'ca', 'cbk-zam', 'cdo', 'ce', 'ceb', 'ch', 'cho', 'chr', 'chy', 'ckb', 'co', 'cps', 'cr',
    'crh', 'crh-cyrl', 'crh-latn', 'cs', 'csb', 'cu', 'cv', 'cy', 'da', 'de', 'diq', 'dsb', 'dtp', 'dv', 'dz', 'ee',
    'el', 'eml', 'en', 'eo', 'es', 'et', 'eu', 'ext', 'fa', 'ff', 'fi', 'fiu-vro', 'fj', 'fo', 'fr', 'frp', 'frr',
    'fur', 'fy', 'ga', 'gag', 'gan', 'gan-hans', 'gan-hant', 'gd', 'gl', 'glk', 'gn', 'got', 'grc', 'gsw', 'gu',
    'gv', 'ha', 'hak', 'haw', 'he', 'hi', 'hif', 'hif-latn', 'hil', 'ho', 'hr', 'hsb', 'ht', 'hu', 'hy', 'hz', 'id',
    'ig', 'ii', 'ik', 'ike-cans', 'ike-latn', 'ilo', 'inh', 'io', 'is', 'it', 'iu', 'ja', 'jam', 'jbo', 'jut', 'jv',
    'ka', 'kaa', 'kab', 'kbd', 'kbd-cyrl', 'kg', 'khw', 'ki', 'kiu', 'kj', 'kk', 'kk-arab', 'kk-cn', 'kk-cyrl', 'kk-kz',
    'kk-latn', 'kk-tr', 'kl', 'km', 'kn', 'ko', 'ko-kp', 'koi', 'kr', 'krc', 'kri', 'krj', 'ks', 'ks-arab', 'ks-deva',
    'ku', 'ku-arab', 'ku-latn', 'kv', 'kw', 'ky', 'la', 'lad', 'lb', 'lbe', 'lez', 'lfn', 'lg', 'li', 'lij', 'liv',
    'lmo', 'ln', 'lo', 'loz', 'lt', 'ltg', 'lv', 'lzh', 'lzz', 'mai', 'map-bms', 'mdf', 'mg', 'mh', 'mhr', 'mi', 'min',
    'mk', 'ml', 'mn', 'mo', 'mr', 'mrj', 'ms', 'mt', 'mus', 'my', 'myv', 'mzn', 'na', 'nah', 'nan', 'nap', 'ne', 'new',
    'ng', 'niu', 'nl', 'nl-informal', 'nn', 'no', 'nov', 'nrm', 'nso', 'nv', 'ny', 'oc', 'om', 'or', 'os', 'pa', 'pag',
    'pam', 'pap', 'pcd', 'pi', 'pih', 'pl', 'pms', 'pnb', 'pnt', 'prg', 'ps', 'pt', 'pt-br', 'qu', 'qug', 'rgn', 'rif',
    'rm', 'rmy', 'rn', 'ro', 'roa-rup', 'roa-tara', 'ru', 'rue', 'rup', 'ruq', 'ruq-cyrl', 'ruq-latn', 'rw', 'sa',
    'sah', 'sc', 'scn', 'sco', 'sd', 'sdc', 'se', 'sei', 'sg', 'sgs', 'sh', 'shi', 'shi-latn', 'shi-tfng', 'si', 'sk',
    'sl', 'sli', 'sm', 'sma', 'sn', 'so', 'sq', 'sr', 'sr-ec', 'sr-el', 'srn', 'ss', 'st', 'stq', 'su', 'sv', 'sw',
    'szl', 'ta', 'tcy', 'te', 'tet', 'tg', 'tg-cyrl', 'tg-latn', 'th', 'ti', 'tk', 'tl', 'tly', 'tn', 'to', 'tpi',
    'tr', 'ts', 'tt', 'tt-cyrl', 'tt-latn', 'tum', 'tw', 'ty', 'tyv', 'udm', 'ug', 'ug-arab', 'ug-latn', 'uk', 'ur',
    'uz', 'val', 've', 'vec', 'vep', 'vi', 'vls', 'vmf', 'vo', 'vot', 'vro', 'wa', 'war', 'wo', 'wuu', 'xal', 'xh',
    'xmf', 'yi', 'yo', 'yue', 'za', 'zea', 'zh', 'zh-hk', 'zh-tw', 'zu'];

var domains = [
    'fandom.com',
    'wikia.org',
    'gamepedia.com'
];

/**
 * Trims URL and other fluff from a wiki
 * @param {String} url Uncleaned link to the wiki (or link to a user)
 * @returns {String} a wiki in the form test.fandom.com/es, null if wiki not found
 */
function cleanWiki(url) {
    // Clean up leading/trailing spaces
    url = url.trim();
    // Remove <>
    url = url.replace(/[<>]/g, '');
    // Remove http/s
    url = url.replace(/(https?:)?\/\//g, '');
    // Add a / at the end
    url = url.replace(/\/+$/g, '');
    url = url.toLowerCase();

    // Figure out language
    let lang = '';
    var match = url.match(/\.(fandom|gamepedia|wikia)\.(com|org|io)\/([^\/]*).*/i);
    if (match) {
        if (languages.indexOf(match[3]) > -1) {
            lang = match[3];
        }
    }
    url = url.replace(/\/.*$/g, '');
    if (lang) {
        url += '/' + lang;
    }
    return url;
}

function stringToBoolean(string){
    switch(string.toLowerCase().trim()){
        case "true": case "yes": case "1": return true;
        case "false": case "no": case "0": case null: return false;
        default: return Boolean(string);
    }
}

commands.create = function(message, params) {
    if (!checkParamCount(message, params, 'create', 1, null)) return;
    let cmd, feed, description;
    [cmd, feed, ...description] = params;
    description = description.join(' ');
    if (!description) description = config.defaultConfig.info;
    if (feed in feeds) {
        message.channel.send(`Cannot create, the feed '${feed}' already exists.`);
        return;
    } else {
        feeds[feed] = {
            "wikis": [],
            "channels": [],
            "webhooks": [],
            "config": {
                "info": description
            }
        };
        saveFeeds();
        message.channel.send(`Feed created! Use add-wiki, add-channel or add-webhook in the form \`df!add-wiki ${feed} <url|channel_id>\`.`);
    }
};

function feedToString(feed) {
    let nWikis = feeds[feed].wikis.length,
        nChannels = feeds[feed].channels.length,
        nWebhooks = feeds[feed].webhooks.length,
        info = feeds[feed].config.info;
    
    if (!info) info = config.defaultConfig.info;
    
    const strWikis = `${nWikis} wiki${nWikis === 1 ? '' : 's'}`,
          strChannels = `${nChannels} webhook${nChannels === 1 ? '' : 's'}`,
          strWebhooks = `${nWebhooks} channel${nWebhooks === 1 ? '' : 's'}`;
          
    return `**${feed}** | ${strWikis}, ${strChannels}, ${strWebhooks} | ${info}`;
}

commands['list-feeds'] = function(message, params) {
    let resp = `${Object.keys(feeds).length} feed${Object.keys(feeds).length === 1 ? '' : 's'} running!\n`;

    if (feeds.length === 0) {
        return;
    }

    for (const feed of Object.keys(feeds)) {
        resp += feedToString(feed) + '\n';
    } 
    message.channel.send(resp);
}

commands.archive = function(message, params) {
    if (!checkParamCount(message, params, 'archive', 1, 1)) return;
    let cmd, feed;
    [cmd, feed] = params;
    if (feed in feeds) {
        feeds[feed].config.archived = true;
        saveFeeds();
        message.channel.send(`Feed archived.`);
    } else {
        message.channel.send(`Feed not found.`);
    }
};

commands.info = function(message, params) {
    if (!checkParamCount(message, params, 'info', 1, 1)) return;
    let cmd, feed;
    [cmd, feed] = params;
    if (feed in feeds) {
        message.channel.send(`Feed '${feed}': ${feeds[feed].config.info}`);
    } else {
        message.channel.send(`Feed not found.`);
    }
};

commands['add-wiki'] = function(message, params) {
    if (!checkParamCount(message, params, 'add-wiki', 2, 2)) return;
    let cmd, feed, wiki;
    [cmd, feed, wiki] = params;
    wiki = cleanWiki(wiki);
    if (feed in feeds) {
        if (!wiki.match(/\.(fandom|gamepedia|wikia)\.(com|org|io)/i)) {
            wiki = wiki + '.fandom.com';
        }
        if (feeds[feed].wikis.includes(wiki)) {
            message.channel.send(`The wiki ${wiki} is already part of this feed.`);
        } else {
            feeds[feed].wikis.push(wiki);
            saveFeeds();
            message.channel.send(`Wiki ${wiki} added to the feed.`);
        }
    } else {
        message.channel.send(`Feed not found or wiki is not provided as a link (e.g. community.fandom.com).`);
    }
};

commands['remove-wiki'] = function(message, params) {
    if (!checkParamCount(message, params, 'remove-wiki', 2, 2)) return;
    let cmd, feed, wiki;
    [cmd, feed, wiki] = params;
    wiki = cleanWiki(wiki);
    if (feed in feeds) {
        if (!wiki.match(/\.(fandom|gamepedia|wikia)\.(com|org|io)/i)) {
            wiki = wiki + '.fandom.com';
        }
        if (feeds[feed].wikis.includes(wiki)) {
            var index = feeds[feed].wikis.indexOf(wiki);
            if (index !== -1) {
                feeds[feed].wikis.splice(index, 1);
            }
            saveFeeds();
            message.channel.send(`Wiki ${wiki} removed from the feed.`);
        } else {
            message.channel.send(`The wiki ${wiki} is not part of this feed.`);
        }
    } else {
        message.channel.send(`Feed not found or wiki is not provided as a link (e.g. community.fandom.com).`);
    }
};

commands['list-wikis'] = function(message, params) {
    if (!checkParamCount(message, params, 'list-wikis', 1, 1)) return;
    let cmd, feed;
    [cmd, feed] = params;
    if (feed in feeds) {
        if (feeds[feed].wikis.length === 0) {
            message.channel.send(`No wikis are linked to this feed. Add some by using \`df!add-wiki ${feed} <url>\`!`);
        } else {
            let out = `The following wikis are part of this feed:\n- `;
            out += feeds[feed].wikis.join('\n- ');
            message.channel.send(out);
        }
    } else {
        message.channel.send(`Feed not found.`);
    }
};

commands['add-channel'] = function(message, params) {
    if (!checkParamCount(message, params, 'add-channel', 2, 2)) return;
    let cmd, feed, channel;
    [cmd, feed, channel] = params;
    if (!/^-?\d{18}$/g.test(channel)) {
        message.channel.send(`The channel ID provided is not valid.`);
        return;
    }
    if (feed in feeds) {
        if (feeds[feed].channels.includes(channel)) {
            message.channel.send(`The channel ${channel} is already part of this feed.`);
        } else {
            feeds[feed].channels.push(channel);
            saveFeeds();
            message.channel.send(`The channel was added to the feed.`);
        }
    } else {
        message.channel.send(`Feed not found.`);
    }
};

commands['remove-channel'] = function(message, params) {
    if (!checkParamCount(message, params, 'remove-channel', 2, 2)) return;
    let cmd, feed, channel;
    [cmd, feed, channel] = params;
    if (!/^-?\d{18}$/g.test(channel)) {
        message.channel.send(`The channel ID provided is not valid.`);
        return;
    }
    if (feed in feeds) {
        if (feeds[feed].channels.includes(channel)) {
            var index = feeds[feed].channels.indexOf(channel);
            if (index !== -1) {
                feeds[feed].channels.splice(index, 1);
            }
            saveFeeds();
            message.channel.send(`The channel was removed from the feed.`);
        } else {
            message.channel.send(`The channel is not part of this feed.`);
        }
    } else {
        message.channel.send(`Feed not found.`);
    }
};

commands['add-webhook'] = function(message, params) {
    if (!checkParamCount(message, params, 'add-webhook', 2, 2)) return;
    let cmd, feed, webhook;
    [cmd, feed, webhook] = params;
    if (!/^https:\/\/discord/g.test(webhook) || !/\/\d{18}\/.{68}$/g.test(webhook)) {
        message.channel.send(`The webhook link provided is not valid.`);
        return;
    }
    if (feed in feeds) {
        if (feeds[feed].webhooks.includes(webhook)) {
            message.channel.send(`The webhook is already part of this feed.`);
        } else {
            feeds[feed].webhooks.push(webhook);
            saveFeeds();
            message.channel.send(`The webhook was added to the feed.`);
        }
    } else {
        message.channel.send(`Feed not found.`);
    }
};

commands['remove-webhook'] = function(message, params) {
    if (!checkParamCount(message, params, 'remove-webhook', 2, 2)) return;
    let cmd, feed, webhook;
    [cmd, feed, webhook] = params;
    if (!/^https:\/\/discord/g.test(webhook) || !/\/\d{18}\/[\w\d_]{68}$/g.test(webhook)) {
        message.channel.send(`The webhook link provided is not valid.`);
        return;
    }
    if (feed in feeds) {
        if (feeds[feed].webhooks.includes(webhook)) {
            var index = feeds[feed].webhooks.indexOf(webhook);
            if (index !== -1) {
                feeds[feed].webhooks.splice(index, 1);
            }
            saveFeeds();
            message.channel.send(`The webhook was removed from the feed.`);
        } else {
            message.channel.send(`The webhook is not part of this feed.`);
        }
    } else {
        message.channel.send(`Feed not found.`);
    }
};

commands.config = function(message, params) {
    if (!checkParamCount(message, params, 'config', 2, null)) return;
    let cmd, feed, key, value;
    [cmd, feed, key, ...value] = params;
    value = value.join(' ');
    if (!(key in config.defaultConfig)) {
        message.channel.send(`The key is not valid and must be one of: ${Object.keys(config.defaultConfig).join(', ')}.`);
        return;
    }
    if (feed in feeds) {
        if (!value) {
            value = (key in feeds[feed].config) ? feeds[feed].config[key] : config.defaultConfig[key];
            message.channel.send(`${key}: ${value.toString()}`);
            return;
        }
        if (config.configDescriptions[key].type === 'boolean') {
            value = stringToBoolean(value);
        }
        feeds[feed].config[key] = value;
        saveFeeds();
        message.channel.send(`The config value was set. ${key}: ${value.toString()}`);        
    } else {
        message.channel.send(`Feed not found.`);
    }
};

commands['config-list'] = function(message, params) {
    let out = config.about + '\n';
    for (const cnf of Object.entries(config.configDescriptions)) {
        out += `- ${cnf[0]} [${cnf[1].type}]: ${cnf[1].description}\n`;
    }
    message.channel.send(out);
};

commands.help = function(message, params) {
    let out = config.about + '\n';
    for (const cmd of Object.keys(config.commands)) {
        out += '- ' + generateHelpCommand(cmd) + '\n';
    }
    message.channel.send(out);
};

module.exports = commands;