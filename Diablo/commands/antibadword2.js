const fs = require('fs');
const path = require('path');

const FILE = 'data/antibadword.json';
fs.mkdirSync(path.dirname(FILE), { recursive: true });
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}', 'utf8');

const load = () => JSON.parse(fs.readFileSync(FILE, 'utf8'));
const save = (data) => fs.writeFileSync(FILE, JSON.stringify(data, null, 2));

module.exports = {
  name: 'antibadword',
  aliases: ['badwordon', 'badwordoff'],
  groupOnly: true,
  desc: 'Toggle anti-badword system',

  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const db = load();
    const current = !!db[chatId];

    let newState;
    if (args[0] === 'on' || msg.command === 'badwordon') newState = true;
    else if (args[0] === 'off' || msg.command === 'badwordoff') newState = false;
    else newState = !current;

    db[chatId] = newState;
    save(db);

    if (!conn.antibadGroups) conn.antibadGroups = {};
    conn.antibadGroups[chatId] = newState;

    const text = newState
      ? '🛡️ Anti-badword is now *ON* in this group.'
      : '❌ Anti-badword is now *OFF*.';
    return conn.sendMessage(chatId, { text }, { quoted: msg });
  }
};
