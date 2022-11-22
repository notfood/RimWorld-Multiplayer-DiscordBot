import dotenv from 'dotenv';

dotenv.config();

export const google_private_key = process.env['google_private_key'].replace(/\\n/g, '\n');
export const google_email = process.env['google_email'];
export const spreadsheet = process.env['spreadsheet'];
export const range = "A3:F";

export const token = process.env['discord_token'];
export const clientId = process.env['discord_clientId'];
export const guildId = process.env['discord_guildId'];

export const expressPort = process.env['expressPort'] || 3000;
