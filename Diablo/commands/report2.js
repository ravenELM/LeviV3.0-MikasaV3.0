const { ownerIDs } = require('../config');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'report',
  aliases: [],
  description: 'Send a report message to the bot owner.',
  modOnly: false,
  ownerOnly: false,
  groupOnly: false,

  /**
   * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   * @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[] }} ctx
   */
  async run(msg, { conn, args }) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!args.length) {
      return conn.sendMessage(from, {
        text: '❌ Please provide a report message.\nUsage: .report <message>',
      }, { quoted: msg });
    }

    const reportText = args.join(' ');

    // Prepare owner report
    const reportMsg =
      `📩 *New Bug Report Submitted!*\n\n` +
      `🧑‍💻 *Reporter:* @${sender.split('@')[0]}\n` +
      `💬 *Message:* ${reportText}`;

    // Send to each owner
    for (const owner of ownerIDs) {
      await conn.sendMessage(owner, {
        text: reportMsg,
        mentions: [sender],
      });
    }

    // Path to your gif (ensure it exists in your project)
    const gifPath = path.join(__dirname, '..', 'media', 'report.gif'); // adjust path as needed

    // Check if gif exists
    const gifExists = fs.existsSync(gifPath);

    // Acknowledge reporter with GIF + styled text
    await conn.sendMessage(from, {
  caption: `╭──────⊹⊱📝⊰⊹──────╮\n` +
           `✨ Ohayou, *Master*! ✨\n\n` +
           `⁺‧₊˚ *Your report has been delivered to my Creator.*\n` +
           `If you're trolling... prepare to be cast into the void. ☠️\n\n` +
           `🧾 *Reporter:* ${sender.split('@')[0]}\n` +
           `📢 *Report:* ${reportText}\n\n` +
           `ありがとう! ~ Your words have been noted.\n` +
           `╰──────⊹⊱🌸⊰⊹──────╯`,
  video: { url: 'https://media.tenor.com/_aKb9jOw7zoAAAPo/mikasa-workout.mp4' }, // anime-style thank you GIF
  gifPlayback: true,
  mimetype: 'video/mp4'
}, { quoted: msg });
  }
};
