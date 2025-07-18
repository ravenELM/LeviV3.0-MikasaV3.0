// commands/owner-leave.js
const config = require('../config');
const { ownerIDs, mods }    = require('../config');

module.exports = {
  name: 'leave-bot2',
  aliases: ['exit', 'gtfo'],
  description: 'Owner / Mods: make the bot leave the current group',

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   *  @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[] }} ctx */
  async run(msg, { conn, args }) {
    const chat   = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    /* 1) Must be used inside a group -------------------------------- */
    if (!chat.endsWith('@g.us')) {
      return conn.sendMessage(chat, {
        text: '❌  This command can only be used *inside a group*, Baka!'
      }, { quoted: msg });
    }

    /* 2) Permission: owner or moderator ----------------------------- */
    const isOwner = config.ownerIDs?.includes(sender);
    const isMod   = config.mods     ?.includes(sender);
    if (!isOwner && !isMod) {
      return conn.sendMessage(chat, {
        text: '❌  Only my Master or Mods can order me to leave, Baka!'
      }, { quoted: msg });
    }

    /* 3) Optional custom goodbye text ------------------------------- */
    const farewell = args.length
      ? args.join(' ')
      : '👋  Thanks for having me! Arigato';

    try {
      await conn.sendMessage(chat, { text: farewell });
      await conn.groupLeave(chat);
    } catch (err) {
      console.error('[leave] error:', err);
      await conn.sendMessage(chat, {
        text: '⚠️  I tried to leave but something went wrong (maybe I’m not an admin?).'
      });
    }
  }
};
