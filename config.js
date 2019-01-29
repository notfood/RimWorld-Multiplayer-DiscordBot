const config = {
  "prefix": "!",
  "google_private_key": process.env.google_private_key.replace(/\\n/g, '\n'),
  "google_email": process.env.google_email,
  "token": process.env.discord_token,
  "spreadsheet": process.env.spreadsheet,
  "range": "A3:F",
}

module.exports = config;
