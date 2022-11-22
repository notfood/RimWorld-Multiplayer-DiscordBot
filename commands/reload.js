import { SlashCommandBuilder } from 'discord.js';

export const cooldown = 30;
export const data = new SlashCommandBuilder()
  .setName('reload')
  .setDescription('Reload spreadsheet.');

export async function execute(interaction) {
  // Get calling user's guildMember info
  let callingUser = interaction.member;

  // Make sure calling user is a manager or above
  let role = callingUser.roles.cache.some(role => role.name === 'Staff');

  if (!role) {
    return;
  }

  try {
    const { init } = await import('./mod.js')
    init();
  } catch (error) {
    return console.error(error);
  }

  await interaction.reply('Reloaded spreadsheet.');
}
