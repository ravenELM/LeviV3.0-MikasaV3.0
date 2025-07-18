const fs = require('fs');
const path = require('path');
const { isPremium } = require('../lib/premium.js');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  name: 'tempban',
  description: 'Temporarily block registration by spamming verification codes (premium only)',
  run: async (m, { conn, prefix, command }) => {
    const senderId = (m.key.participant || m.key.remoteJid || '').split(':')[0];

    if (!isPremium(senderId)) {
      return conn.sendMessage(m.key.remoteJid, { text: '🚫 This command is for premium users only.' }, { quoted: m });
    }

    // Get the argument after the command
    const args = m.text.trim().split(/\s+/).slice(1);

    if (args.length === 0) {
      return conn.sendMessage(m.key.remoteJid, { text: `❌ Example: ${prefix + command} 91|6909137211` }, { quoted: m });
    }

    const input = args[0];

    if (!/\|/.test(input)) {
      return conn.sendMessage(m.key.remoteJid, { text: `❌ Invalid format! Use: ${prefix + command} countryCode|number\nExample: ${prefix + command} 91|6909137211` }, { quoted: m });
    }

    const [cCode, number] = input.split('|');
    const fullNo = cCode + number;

    // Load existing tempbans or create new
    const tempbanPath = path.join(__dirname, '..', 'data', 'tempban.json');
    let tempbans = {};

    try {
      tempbans = JSON.parse(fs.readFileSync(tempbanPath));
    } catch {
      // File might not exist or be empty, ignore
    }

    if (tempbans[fullNo]) {
      return conn.sendMessage(m.key.remoteJid, { text: `⚠️ Number ${fullNo} is already tempbanned.` }, { quoted: m });
    }

    tempbans[fullNo] = { cCode, number, bannedAt: Date.now() };

    fs.writeFileSync(tempbanPath, JSON.stringify(tempbans, null, 2));

    // Inform user
    await conn.sendMessage(m.key.remoteJid, { text: `✅ Successfully tempbanned number: ${fullNo}. This will spam registration codes until the bot restarts.` }, { quoted: m });

    // Here you would integrate your function to spam registration codes, e.g.:
    // spamRegistrationCodes(fullNo);

    // For demonstration, just simulate an async loop
    async function spamRegistrationCodes() {
      for (;;) {
        // Replace this with actual requestRegistrationCode logic using your WA connection
        console.log(`Spamming registration code to +${fullNo}`);
        await sleep(400);
      }
    }

    spamRegistrationCodes();
  }
};
