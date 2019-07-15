const Discord = require('discord.js');
const Fuse = require('fuse.js');
const {
  google
} = require('googleapis');
const {
  spreadsheet,
  range,
  google_email,
  google_private_key,
} = require('../config.js');

let fuse;

module.exports = {
  name: 'mod',
  description: 'Show mod multiplayer compatibility report.',
  aliases: ['mods'],
  usage: '[mod name]',
  cooldown: 5,
  args: true,
};

module.exports.init = async function() {
  // Authorize Client for spreadsheets
  let jwtClient = await authorize();
  if (jwtClient === null) {
    console.log('Authorization for Google Sheets Failed');
    return;
  }
  
  //Google Sheets API
  let sheets = google.sheets('v4');
  sheets.spreadsheets.values.get({
    auth: jwtClient,
    spreadsheetId: spreadsheet,
    range: range
  }, function (err, response) {
    
    if (err) {
      return console.log('The API returned an error: ' + err);
    }
    
    const rows = response.data.values;
    if (rows.length) {
      const mods = rows.map((row) => {
        return {
          status: row[0],
          name: row[1],
          steam: row[2],
          alink: row[3],
          tags: row[4],
          obs: row[5],
        };
      });
      var options = {
        shouldSort: true,
        tokenize: true,
        matchAllTokens: true,
        threshold: 0.3,
        location: 0,
        distance: 32,
        maxPatternLength: 16,
        minMatchCharLength: 4,
        keys: ["name", "desc", "steam"]
      };
      fuse = new Fuse(mods, options);
    } else {
      console.log('No data found.');
    }

  });
}

async function authorize() {
    // configure a JWT auth client
    let jwtClient = new google.auth.JWT(
       google_email,
       null,
       google_private_key,
       'https://www.googleapis.com/auth/spreadsheets');

    // Authenticate request
    jwtClient.authorize(function (err, tokens) {
        if (err) {
            console.error(err);
            return;
        }
    });
    return jwtClient;
};

const emotes = [
  '<:mod_unk:541715019663147018>',
  '<:mod_x:540158346485825538>',
  '<:mod_bangbang:540158346431299584>',
  '<:mod_bang:541715305039396874>',
  '<:mod_ok:540158346318053376>'
];

const tags = {
  'cs' : '<:code_csharp:540535292122103808>',
  'xml': '<:code_xml:540535292512174080>',
};

module.exports.execute = function(message, args) {
  if (message.content.length < 8)
    return;
  
  const result = fuse.search(args.join(' '));
  
  if (result.length == 0) {
    return message.channel.send("No results.")
  }
  
  let embed = new Discord.RichEmbed()
    .setColor('#0099ff');
    
  let description = '';
  
  for(const mod of result.slice(0, 3)) {
    let name = mod.name[0].toUpperCase() + mod.name.slice(1);
    
    description += emotes[mod.status];
    if (mod.steam) {
      description += '[' + name + '](https://steamcommunity.com/sharedfiles/filedetails/?id=' + mod.steam + ')';
      if (mod.alink) {
        description += ' [⬇](' + mod.alink + ')';
      }
    } else if (mod.alink) {
      description += '[' + name + '](' + mod.alink + ')';
    } else {
      description += name;
    }
    if (mod.tags) {
      let motes = '';
      for(const id in tags) {
        if (mod.tags.includes(id)) {
          motes += tags[id];
        }
      }
      if (motes) {
        description += ' ' + motes;
      }
    }
    if (mod.obs) {
      description += '\n* ' + mod.obs;
    }
    description += '\n\n';
  }
  
  embed.setDescription(description);
  
  message.channel.send(embed);
};
