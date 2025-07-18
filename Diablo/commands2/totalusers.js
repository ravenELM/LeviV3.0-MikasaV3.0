const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'totalusers',
  aliases: ['usercount', 'users'],
  description: 'Show how many users use the bot in total',
  async run(msg, { conn }) {
    const file = path.join(process.cwd(), 'data', 'cards.json');
    let data;
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return conn.sendMessage(msg.key.remoteJid, { text: '❌ Could not read user data.' }, { quoted: msg });
    }
    const users = data.users ? Object.keys(data.users) : [];
    const count = users.length;
    return conn.sendMessage(
      msg.key.remoteJid,
      { text: `👥 Total users: *${count}*` },
      { quoted: msg }
    );
  }
};