const fs = require('fs');
const path = require('path');
const axios = require('axios');

const claimedPath = path.join(__dirname, '..', 'data', 'claimed.json');
if (!fs.existsSync(claimedPath)) fs.writeFileSync(claimedPath, '{}');

function loadClaims() {
  return JSON.parse(fs.readFileSync(claimedPath));
}

async function downloadToBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data, 'binary');
}

module.exports = {
  name: 'vcard',
  aliases: ['vcard', 'vc'],
  description: 'View a specific card from your collection by number',
  run: async (msg, { conn, args }) => {
    const chatId = msg.key.remoteJid;
    const senderId = msg.key.participant || chatId;

    if (!args.length || isNaN(args[0])) {
      return conn.sendMessage(chatId, {
        text: '❌ Usage: *.viewcard <number>*\nExample: *.viewcard 2*'
      }, { quoted: msg });
    }

    const cardNumber = parseInt(args[0]);
    const claims = loadClaims();

    if (!claims[senderId]) {
      return conn.sendMessage(chatId, {
        text: '❌ You have no cards claimed yet.'
      }, { quoted: msg });
    }

    const userCards = Object.values(claims[senderId]);

    if (cardNumber < 1 || cardNumber > userCards.length) {
      return conn.sendMessage(chatId, {
        text: `❌ Invalid card number. You have ${userCards.length} cards.`
      }, { quoted: msg });
    }

    const card = userCards[cardNumber - 1];
    const tier = (card.tier || '').toUpperCase();
    let imgUrl = card.img;
    let ext = imgUrl.split('.').pop().toLowerCase();

    // For tiers other than TS or T6, convert gif/mp4 to png
    if (tier !== 'TS' && tier !== 'T6') {
      if (ext === 'gif' || ext === 'mp4') {
        imgUrl = imgUrl.replace(/\.(gif|mp4)$/i, '.png');
        ext = 'png';
      }
    }

    try {
      // If you want to avoid downloading for video/gif with url support, skip download for those and send url directly
      if (ext === 'gif' || ext === 'mp4') {
        // Send as video with gifPlayback true (like your owner cmd example)
        await conn.sendMessage(chatId, {
          video: { url: imgUrl },
          gifPlayback: true,
          caption:
            `🎴 *Card Info*\n` +
            `🌟 *Name:* ${card.name}\n` +
            `💎 *Tier:* ${card.tier}\n` +
            `🔐 *Captcha:* ${card.captcha}\n` +
            `💰 *Price:* $${card.price.toLocaleString()}`
        }, { quoted: msg });
      } else {
        // For png or other images, download and send image buffer
        const mediaBuffer = await downloadToBuffer(imgUrl);
        await conn.sendMessage(chatId, {
          image: mediaBuffer,
          caption:
            `🎴 *Card Info*\n` +
            `🌟 *Name:* ${card.name}\n` +
            `💎 *Tier:* ${card.tier}\n` +
            `🔐 *Captcha:* ${card.captcha}\n` +
            `💰 *Price:* $${card.price.toLocaleString()}`
        }, { quoted: msg });
      }
    } catch (e) {
      console.error('❌ Failed to send media:', e.message);
      await conn.sendMessage(chatId, {
        text: '❌ Failed to load card media.'
      }, { quoted: msg });
    }
  }
};
