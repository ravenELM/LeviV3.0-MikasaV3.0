// commands/gaycheck.js
const chalk = require('chalk');

const rainbowColors = [
  '\x1b[31m', // red
  '\x1b[33m', // yellow
  '\x1b[32m', // green
  '\x1b[36m', // cyan
  '\x1b[34m', // blue
  '\x1b[35m'  // magenta
];

// helper: generate rainbow tinted string for terminal (optional)
function rainbowText(text) {
  return text
    .split('')
    .map((char, i) => rainbowColors[i % rainbowColors.length] + char)
    .join('') + '\x1b[0m';
}

module.exports = {
  name: 'gaycheck',
  aliases: ['gay'],
  description: 'Check how gay someone is 🌈',

  async run(msg, { conn, args }) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // Get target user: mentioned or sender
    let targetId = sender;
    let targetName = 'You';

    if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      targetId = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      // Optional: fetch contact name
      try {
        const contact = await conn.onWhatsApp(targetId);
        targetName = contact && contact[0]?.notify || 'User';
      } catch {
        targetName = 'User';
      }
    } else if (args.length) {
      targetName = args.join(' ');
    } else {
      // fetch sender name if possible
      try {
        const contact = await conn.onWhatsApp(sender);
        targetName = contact && contact[0]?.notify || 'You';
      } catch {
        targetName = 'You';
      }
    }

    // Random gay percentage 0-100
    const gayPercent = Math.floor(Math.random() * 101);

    // Create progress bar using emojis 🌈 for filled, ⚪ for empty
    const totalBars = 10;
    const filledBars = Math.round((gayPercent / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    const bar = '🌈'.repeat(filledBars) + '⚪'.repeat(emptyBars);

    // Compose message
    const text =
      `🌈 *Gaycheck* 🌈\n` +
      `*${targetName}* is *${gayPercent}%* gay!\n\n` +
      `${bar}`;

    // Send with a rainbow tinted text bubble effect - we simulate by adding some colored emojis or styles
    // Baileys doesn't support colored text, so just send the message with emojis for effect

    await conn.sendMessage(from, { text }, { quoted: msg });
  }
};
