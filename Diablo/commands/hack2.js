// commands/hackuser.js
const crypto = require('crypto');

function randomLine(len = 64) {
  return crypto.randomBytes(len).toString('hex').slice(0, len);
}

function generateHackData(lines = 100, width = 64) {
  let txt = '';
  for (let i = 0; i < lines; i++) txt += randomLine(width) + '\n';
  return txt;
}

module.exports = {
  name: 'hack',
  aliases: ['fakehack', 'hax'],
  desc: 'Prank: pretend to hack a user & send scary link',
  groupOnly: true,

  async run(msg, { conn, args }) {
    const chatId  = msg.key.remoteJid;
    const target  = args[0] || (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) || 'someone';
    const hacker  = msg.pushName || 'Anonymous';

    /* 1) generate fake “leaked” data as a Buffer */
    const fakeText = generateHackData(120, 72);
    const fileBuf  = Buffer.from(fakeText, 'utf-8');

    /* 2) send the file */
    await conn.sendMessage(
      chatId,
      {
        document : fileBuf,
        mimetype : 'text/plain',
        fileName : 'leaked_passwords.txt',
        caption  : `💻 Breaching ${target}...\n🔓 Access granted by ${hacker}!\nDownloading credentials...`
      },
      { quoted: msg }
    );

    /* 3) send scary link (replace with any jump‑scare URL you like) */
    const prankUrl = 'https://tinyurl.com/mu2pz7bz';   // full‑screen fake terminal
    await conn.sendMessage(
      chatId,
      { text: `⚠️ DOWNLOAD COMPLETE.\n👉 View detailed dump: ${prankUrl}` },
      { quoted: msg }
    );
  }
};
