const fs = require('fs');
const path = require('path');
const { ownerIDs } = require('../config');  // Make sure you have ownerIDs in your config

const FILE = 'data/badwords.json';
fs.mkdirSync(path.dirname(FILE), { recursive: true });
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]', 'utf8');

const load = () => JSON.parse(fs.readFileSync(FILE, 'utf8'));
const save = (arr) => fs.writeFileSync(FILE, JSON.stringify(arr, null, 2));

const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name: 'addbadword',
  aliases: ['addbad'],
  groupOnly: true,
  desc: 'Add word(s) to badword list (owner only)',

  async run(msg, { conn, args }) {
    const senderId = norm(msg.key.participant || msg.key.remoteJid);

    if (!ownerIDs.map(norm).includes(senderId)) {
      return conn.sendMessage(msg.key.remoteJid, { text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*' }, { quoted: msg });
    }

    if (!args.length)
      return conn.sendMessage(msg.key.remoteJid, { text: '❌ Example: *.addbadword idiot*' }, { quoted: msg });

    const list = load();
    const added = [];

    for (let word of args) {
      word = word.toLowerCase();
      if (!list.includes(word)) {
        list.push(word);
        added.push(word);
      }
    }

    save(list);

    const reply = added.length
      ? `✅ Added bad word(s): ${added.join(', ')}`
      : '⚠️ Those word(s) already exist.';
    return conn.sendMessage(msg.key.remoteJid, { text: reply }, { quoted: msg });
  }
};
