const fs = require('fs');
const path = require('path');

const ECONOMY_FILE = path.join(process.cwd(), 'datamoney', 'economy.json');

function loadEconomy() {
  if (!fs.existsSync(ECONOMY_FILE)) {
    console.log('[DEBUG] economy.json not found at:', ECONOMY_FILE);
    return {};
  }
  try {
    const data = JSON.parse(fs.readFileSync(ECONOMY_FILE, 'utf-8'));
    console.log('[DEBUG] economy.json loaded');
    return data;
  } catch (e) {
    console.error('[ERROR] Failed to parse economy.json:', e);
    return {};
  }
}

function saveEconomy(data) {
  try {
    fs.writeFileSync(ECONOMY_FILE, JSON.stringify(data, null, 2));
    console.log('[DEBUG] economy.json updated successfully');
  } catch (e) {
    console.error('[ERROR] Failed to write to economy.json:', e);
  }
}

module.exports = {
  name: 'setwname',
  aliases: ['setname', 'wname'],
  description: 'Set your leaderboard display name',
  async run(msg, { conn, args }) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const name = args.join(' ').trim();

    console.log('[DEBUG] Command called by:', sender);
    console.log('[DEBUG] Name argument:', name);

    if (!name) {
      return conn.sendMessage(from, { text: '❌ Please provide a name.\nExample: `.setwname RavenKing`' }, { quoted: msg });
    }

    const economy = loadEconomy();

    if (!economy[sender]) {
      console.log('[DEBUG] Sender not found in economy.json, creating default profile');
      economy[sender] = {
        wallet: 0,
        lastDaily: 0,
        lastPayday: 0,
        lottery: {
          count: 0,
          lastUsed: 0
        },
        slot: {
          count: 0,
          lastUsed: 0
        },
        inventory: {}
      };
    } else {
      console.log('[DEBUG] Sender exists, updating name');
    }

    economy[sender].name = name;
    saveEconomy(economy);

    await conn.sendMessage(from, { text: `✅ Your leaderboard name is now set to: *${name}*` }, { quoted: msg });
  }
};
