const axios = require('axios');
const fs = require('fs');
const path = require('path');

// === FILE PATHS ===
const allowedGroupsPath = path.join(__dirname, '..', 'data', 'allowedcardgcs.json');
const ravenLogoPath = path.join(__dirname, '..', 'media', 'ravenlogo.png'); // Local thumbnail

// === UTILITIES ===
function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return {};
  }
}

const generateCaptcha = (length = 5) =>
  Array.from({ length }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrst'[Math.floor(Math.random() * 36)]
  ).join('');

const generateUniqueCardId = () => 'card_' + Math.random().toString(36).slice(2, 10);

const downloadToBuffer = async (url) => {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data, 'binary');
};

// === LOAD ALLOWED GROUPS ===
let allowedGroups = [];
try {
  const raw = JSON.parse(fs.readFileSync(allowedGroupsPath, 'utf-8'));
  allowedGroups = Array.isArray(raw) ? raw : [];
} catch {
  console.warn('⚠️ Failed to load allowedcardgcs.json');
}

// === MAIN SPAWN FUNCTION ===
async function spawnCard(sock, groupId, activeCards, cardDataList) {
  if (!allowedGroups.includes(groupId)) {
    console.log(`⛔ Skipping spawn in group ${groupId} (not allowed)`);
    return;
  }

  if (!Array.isArray(cardDataList) || cardDataList.length === 0) {
    console.warn('⚠ No card data to spawn.');
    return;
  }

  const spawn = cardDataList[Math.floor(Math.random() * cardDataList.length)];
  const id = generateUniqueCardId();
  const captcha = generateCaptcha();

  const card = {
    id,
    name: spawn.name,
    tier: spawn.tier,
    img: spawn.img,
    price: spawn.price,
    captcha,
    url: spawn.url,
    groupId
  };

  activeCards[id] = card;

  const fileType = card.img.split('.').pop().toLowerCase();
  const isVideo = fileType === 'mp4';

  // Load raven logo thumbnail
  let thumbnail = null;
  try {
    thumbnail = fs.readFileSync(ravenLogoPath);
  } catch (err) {
    console.warn('⚠ Failed to load ravenlogo.png:', err.message);
  }

  // Send thumbnail preview message first
  await sock.sendMessage(groupId, {
    text: `🎴 *Raven-Bots Card Drop* 🎴\nA new anime card is spawning below!\n\n🔔 Solve the captcha to claim.`,
    contextInfo: {
      externalAdReply: {
        title: "New Card Available!",
        body: `${card.name} [${card.tier}]`,
        mediaType: 1,
        renderLargerThumbnail: false,
        showAdAttribution: false,
        ...(thumbnail && { thumbnail }) // only include if loaded
      }
    }
  });

  // Then send actual card media
  try {
    const mediaBuffer = await downloadToBuffer(card.img);

    await sock.sendMessage(groupId, {
      [isVideo ? 'video' : 'image']: mediaBuffer,
      caption:
        `🎉 *New Card Spawned!* 🎉\n` +
        `🌟 *${card.name}*\n` +
        `💰 *Price:* $${card.price}\n` +
        `💎 *Tier:* ${card.tier}\n` +
        `🔐 *Captcha:* ${card.captcha}\n\n` +
        `To claim: *.getc ${card.captcha}*`
    });

    console.log(`✅ Spawned ${card.name} (${card.tier}) in ${groupId}`);
  } catch (err) {
    console.error('❌ Failed to send card:', err.message);
  }
}

module.exports = {
  spawnCard
};
