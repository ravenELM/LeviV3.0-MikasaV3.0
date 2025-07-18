const fs = require('fs');
const path = require('path');

const claimedPath = path.join(__dirname, '..', 'data', 'claimed.json');
if (!fs.existsSync(claimedPath)) fs.writeFileSync(claimedPath, '{}');

function loadClaims() {
  try {
    return JSON.parse(fs.readFileSync(claimedPath));
  } catch {
    return {};
  }
}

module.exports = {
  name: 'allowner',
  aliases: ['ao'],
  description: 'Show who owns a specific card. Usage: .ao Card Name | Tier',

  run: async (msg, { conn, args }) => {
    const chatId = msg.key.remoteJid;
    const claims = loadClaims();

    const input = args.join(' ').split('|');
    const cardName = input[0]?.trim();
    const cardTier = input[1]?.trim()?.toUpperCase();

    if (!cardName || !cardTier) {
      return conn.sendMessage(chatId, {
        text: '❌ Usage: `.ao Card Name | Tier`',
      }, { quoted: msg });
    }

    const owners = [];
    let foundCard = null;

    // Search for owners and capture one card instance to get media info
    for (const [user, cards] of Object.entries(claims)) {
      for (const card of Object.values(cards)) {
        if (
          card.name?.toLowerCase() === cardName.toLowerCase() &&
          card.tier?.toUpperCase() === cardTier
        ) {
          owners.push(user);
          if (!foundCard) foundCard = card; // take the first matched card for media
        }
      }
    }

    if (owners.length === 0) {
      return conn.sendMessage(chatId, {
        text: `❌ No owners found for *${cardName}* | 💎 Tier: ${cardTier}`,
      }, { quoted: msg });
    }

    const mentionTags = owners.map(jid => `@${jid.split('@')[0]}`).join(', ');

    const reply = `🎴 *${cardName}* | 💎 Tier: ${cardTier}\n👥 Owners: ${mentionTags}`;

    const isVideo = foundCard?.img?.endsWith('.mp4');

    await conn.sendMessage(chatId, {
      [isVideo ? 'video' : 'image']: { url: foundCard.img },
      ...(isVideo ? { gifPlayback: true } : {}),
      caption: reply,
      mentions: owners
    }, { quoted: msg });
  }
};
