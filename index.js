const fs = require('fs');
const express = require('express');
const Discord = require('discord.js');
const { prefix, token, expressPort } = require('./config.js');

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  
  if (typeof command.init === "function") {
    try {
      command.init();
    } catch (error) {
      console.log('there was an error trying to init command! ' + command.name);
      console.error(error);
      
      process.exit();
    }
  }
  
  client.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection();

client.on('ready', function () {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setStatus('dnd');
  client.user.setActivity('RimWorld', {
    type: 'PLAYING'
  });
});

client.on('message', message => {
  if (!message.content.startsWith(prefix) || message.author.bot)
    return;
  
  const args = message.content.slice(prefix.length).split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
  
  if (!command)
    return;
  
  if (command.guildOnly && message.channel.type !== 'text') {
    return message.reply('I can\'t execute that command inside DMs!');
  }
  
  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`;
    
    if (command.usage) {
      reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
    }
    
    return message.channel.send(reply);
  }
  
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }
  
  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;
  
  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
    }
  }
  
  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  
  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply('there was an error trying to execute that command!');
  }
});

if (token) {
  client.login(token);
} else {
  console.warn("No discord_token passed! Bot not running.");
}

const expressApp = express();
expressApp.get('/', (req, res) => res.send('The Times 3 January 2009 Chancellor on brink of second bailout for banks'));
expressApp.get('/mod-compatibility', (req, res) => {
  const mods = client.commands.get('mod').mods;
  if (req.query.format === "metadata") {
    res.send(
      mods.map(mod => ({
        status: mod.status,
        name: mod.name,
        workshopId: parseInt(mod.steam) || 0,
        notes: mod.obs || undefined
      }))
    );
  } else {
    // original {steamId: compatibility} format
    res.send(
      mods.reduce((obj, mod) => {
        const compatibility = parseInt(mod.status.substr(0,1));
        if (mod.steam && !isNaN(compatibility)) {
          obj[mod.steam] = compatibility;
        }
        return obj;
      }, {})
    );
  }
});
expressApp.listen(expressPort, () => {
  console.log(`Listening for /mod-compatibility requests on port ${expressPort}`);
});
