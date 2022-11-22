import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';
import { readdirSync } from 'node:fs';
import { token, expressPort } from './config.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, c => {
	console.log(`Logged in as ${client.user.tag}`);
  client.user.setStatus('dnd');
  client.user.setActivity('RimWorld', {
    type: 'PLAYING'
  });
});

client.commands = new Collection();

const commandFiles = readdirSync('commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  console.log('Loading ' + file);
	const command = await import(`./commands/${file}`);
  if ('init' in command && typeof command.init === 'function') {
    try {
      command.init();
    } catch (error) {
      console.log('there was an error trying to init command! ' + command.name);
      console.error(error);
      
      process.exit();
    }
  }
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const cooldowns = new Collection();

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

  if (!cooldowns.has(command.data.name)) {
    cooldowns.set(command.data.name, new Collection());
  }
  
  const now = Date.now();
  const timestamps = cooldowns.get(command.data.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;
  
  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
    
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return await interaction.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.data.name}\` command.`);
    }
  }
  
  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

  try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(token);

import express from 'express';

const expressApp = express();
expressApp.get('/', (req, res) => res.send('The Times 3 January 2009 Chancellor on brink of second bailout for banks'));
expressApp.get('/mod-compatibility', (req, res) => {
  const mods = client.commands.get('mod').mods;
  if (req.query.format === "metadata") {
    res.send(
      mods.map(mod => ({
        status: parseInt(mod.status) || 0,
        name: mod.name || '',
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
