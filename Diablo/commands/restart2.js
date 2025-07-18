// commands/owner-restart.js
const { ownerIDs }   = require('../config');
const { spawn }      = require('child_process');
const path           = require('path');

module.exports = {
  name   : 'restart',
  aliases: ['reboot', 'reload'],
  desc   : 'Owner‑only: fully restart the bot (stop then auto‑start)',

  /**
   * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   * @param {{ conn: import('@whiskeysockets/baileys').WASocket }} ctx
   */
  async run (msg, { conn }) {
    const chatId   = msg.key.remoteJid;
    const senderId = (msg.key.participant || chatId).split(':')[0];

    /* 1️⃣ permission gate */
    if (!ownerIDs.includes(senderId)) {
      return conn.sendMessage(chatId,
        { text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*' },
        { quoted: msg });
    }

    /* 2️⃣ acknowledge */
    await conn.sendMessage(chatId,
      { text: '♻️ Restarting now — back in a sec…' },
      { quoted: msg });

    /* 3️⃣ spawn a brand‑new detached Node process */
    const node      = process.argv[0];     // current Node executable
    const entryFile = process.argv[1];     // current script (index.cjs)
    const child = spawn(node, [entryFile], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'inherit'   // share the same console
    });
    child.unref();       // let it keep running after parent exits

    console.log(`[RESTART] Spawned child PID ${child.pid}. Exiting parent…`);

    /* 4️⃣ give WhatsApp a moment to flush the message, then exit */
    setTimeout(() => process.exit(0), 500);
  }
};
