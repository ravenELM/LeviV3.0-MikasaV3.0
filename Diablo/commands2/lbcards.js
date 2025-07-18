const fs = require('fs');
const path = require('path');

const claimedPath = path.join(__dirname, '..', 'data', 'claimed.json');
if (!fs.existsSync(claimedPath)) fs.writeFileSync(claimedPath, '{}');

// Change this to your actual owner ID (e.g., '1234567890@s.whatsapp.net')
const OWNER_ID = '40736676892@s.whatsapp.net';

function loadClaims() {
  return JSON.parse(fs.readFileSync(claimedPath));
}

module.exports = {
  name: 'lbcards',
  aliases: ['cardtop', 'cardboard'],
  description: 'Show top 5 users with the most cards.',

  run: async (msg, { conn }) => {
    const chatId = msg.key.remoteJid;
    const claims = loadClaims();

    const userStats = Object.entries(claims)
      .filter(([jid]) => jid !== OWNER_ID) // Exclude owner
      .map(([jid, cards]) => {
        return { id: jid, count: Object.keys(cards).length };
      });

    const sorted = userStats.sort((a, b) => b.count - a.count).slice(0, 10);

    if (sorted.length === 0) {
      return conn.sendMessage(chatId, {
        text: '❌ No one has any cards yet, Baka!',
      }, { quoted: msg });
    }

    const medals = ['🥇', '🥈', '🥉', '✦', '✦', '✦', '✦', '✦', '✦', '✦'];
    const rows = sorted.map((user, i) => {
      const mention = `@${user.id.split('@')[0]}`;
      return `${medals[i]} ${mention} — *${user.count} cards*`;
    }).join('\n');

    const leaderboardText = 
`📊 *Top 5 Card Collectors*\n\n${rows}
─────────────────────
🎴 Use: .cl to see your collection`;

    await conn.sendMessage(chatId, {
      text: leaderboardText,
      mentions: sorted.map(u => u.id),
    }, { quoted: msg });
  }
};
