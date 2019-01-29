module.exports = {
  name: 'listemojis',
  description: 'Give me emojis',
  cooldown: 30,
  guildOnly: true,
  execute(message) {
    const emojiList = message.guild.emojis.map((e, x) => (x + ' = ' + e) + ' | ' +e.name).slice(0,15).join('\n');
    message.channel.send(emojiList);
  }
};
