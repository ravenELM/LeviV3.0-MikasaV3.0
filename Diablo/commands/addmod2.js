const fs = require('fs');
const path = require('path');
const ENV_PATH = path.resolve(__dirname, '../.env');
const { ownerIDs } = require('../config');

function parseEnv(content) {
  return Object.fromEntries(
    content
      .split('\n')
      .filter(line => line && !line.startsWith('#') && line.includes('='))
      .map(line => {
        const [key, ...vals] = line.split('=');
        return [key.trim(), vals.join('=').trim()];
      })
  );
}

function serializeEnv(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

function normalizeJid(jid) {
  if (!jid.includes('@')) return jid + '@s.whatsapp.net';
  return jid;
}

function getMentionedUser(msg, args) {
  const context = msg.message?.extendedTextMessage?.contextInfo;
  if (context?.mentionedJid && context.mentionedJid.length > 0) {
    return context.mentionedJid[0];
  }
  if (args.length > 0) {
    return normalizeJid(args[0].replace(/^@/, ''));
  }
  return null;
}

module.exports = {
  name: 'addmod',
  description: 'Owner only: Add a mod by mentioning them, e.g. .addmod @user',
  async run(msg, { conn, args }) {
    const senderId = msg.key.participant || msg.key.remoteJid;
    if (!ownerIDs.includes(senderId)) {
      return conn.sendMessage(msg.key.remoteJid, { text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*' }, { quoted: msg });
    }

    const newMod = getMentionedUser(msg, args);
    if (!newMod) {
      return conn.sendMessage(msg.key.remoteJid, { text: '⚠️ Please mention a user to add as mod.' }, { quoted: msg });
    }

    try {
      const envRaw = fs.readFileSync(ENV_PATH, 'utf-8');
      const envObj = parseEnv(envRaw);

      const mods = envObj.MODS ? envObj.MODS.split(',').map(m => m.trim()) : [];

      if (mods.includes(newMod)) {
        return conn.sendMessage(msg.key.remoteJid, { text: `⚠️ User ${newMod} is already a mod.` }, { quoted: msg });
      }

      mods.push(newMod);
      envObj.MODS = mods.join(',');

      fs.writeFileSync(ENV_PATH, serializeEnv(envObj), 'utf-8');

      await conn.sendMessage(msg.key.remoteJid, { text: `✅ Added ${newMod} to MODS list.` }, { quoted: msg });
    } catch (e) {
      console.error('Error updating .env:', e);
      await conn.sendMessage(msg.key.remoteJid, { text: '❌ Failed to update MODS list.' }, { quoted: msg });
    }
  }
};
