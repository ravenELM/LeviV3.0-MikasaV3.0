const fs = require('fs');
const path = require('path');
const ENV_PATH = path.resolve(__dirname, '../.env');
const { ownerIDs } = require('../config');

// Helper to parse .env file to an object
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

// Helper to serialize object back to .env format string
function serializeEnv(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

// Normalize WhatsApp JID (add domain if missing)
function normalizeJid(jid) {
  if (!jid.includes('@')) return jid + '@s.whatsapp.net';
  return jid;
}

// Extract mentioned user from message context or args
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
  name: 'delmod',
  description: 'Owner only: Remove a mod by mentioning them, e.g. .delmod @user',
  async run(msg, { conn, args }) {
    const senderId = msg.key.participant || msg.key.remoteJid;
    if (!ownerIDs.includes(senderId)) {
      return conn.sendMessage(msg.key.remoteJid, { text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*' }, { quoted: msg });
    }

    const modToRemove = getMentionedUser(msg, args);
    if (!modToRemove) {
      return conn.sendMessage(msg.key.remoteJid, { text: '⚠️ Please mention a user to remove from mods.' }, { quoted: msg });
    }

    try {
      const envRaw = fs.readFileSync(ENV_PATH, 'utf-8');
      const envObj = parseEnv(envRaw);

      let mods = envObj.MODS ? envObj.MODS.split(',').map(m => m.trim()) : [];

      if (!mods.includes(modToRemove)) {
        return conn.sendMessage(msg.key.remoteJid, { text: `⚠️ User ${modToRemove} is not a mod.` }, { quoted: msg });
      }

      mods = mods.filter(m => m !== modToRemove);
      envObj.MODS = mods.join(',');

      fs.writeFileSync(ENV_PATH, serializeEnv(envObj), 'utf-8');

      await conn.sendMessage(msg.key.remoteJid, { text: `✅ Removed ${modToRemove} from MODS list.` }, { quoted: msg });
    } catch (e) {
      console.error('Error updating .env:', e);
      await conn.sendMessage(msg.key.remoteJid, { text: '❌ Failed to update MODS list.' }, { quoted: msg });
    }
  }
};
