const command = require(`./mod.js`);

module.exports = {
  name: 'reload',
  description: 'Reload spreadsheet.',
  cooldown: 30,
  guildOnly: true,
  execute(message) {
    // Get calling user's guildMember info
    let callingUser = message.channel.guild.member(message.author);
    
    // Make sure calling user is a manager or above
    let role = callingUser.roles.cache.some(role => role.name === 'Staff');
    
    if (!role) {
      return;
    }
    
    try {
      command.init();
    } catch (error) {
      return console.error(error);
    }
    
    message.channel.send('Reloaded');
  },
};
