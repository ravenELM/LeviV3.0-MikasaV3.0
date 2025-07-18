const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

module.exports = {
  name: 'horny',
  aliases: [],
  description: 'Give someone an official Horny License',
  async run(m, { conn }) {
    const senderId = m.key.participant || m.key.remoteJid;
    const chatId = m.key.remoteJid;

    const mention = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mention[0] || senderId;

    const userNameRaw = m.pushName || 'User';
    const userName = userNameRaw.length > 20 ? userNameRaw.slice(0, 20) : userNameRaw;

    const userPfpUrl = await conn.profilePictureUrl(target, 'image').catch(() => null);

    const templatePath = path.join(__dirname, '../assets/horny.webp');

    if (!fs.existsSync(templatePath)) {
      return conn.sendMessage(chatId, {
        text: '❌ Template not found. Place `hornylicense.png` in /assets.'
      }, { quoted: m });
    }

    try {
      const template = await loadImage(templatePath);
      const canvas = createCanvas(template.width, template.height);
      const ctx = canvas.getContext('2d');

      // Load avatar
      let avatar;
      if (userPfpUrl) {
        const res = await axios.get(userPfpUrl, { responseType: 'arraybuffer' });
        avatar = await loadImage(Buffer.from(res.data));
      } else {
        const fallback = path.join(__dirname, '../assets/pfp.png');
        avatar = await loadImage(fallback);
      }

      // Ellipse/lips area center and size (adjust as needed for your template)
      const ellipseX = 168;
      const ellipseY = 210;
      const ellipseRadiusX = 95;
      const ellipseRadiusY = 95;
      const ellipseW = ellipseRadiusX * 2;
      const ellipseH = ellipseRadiusY * 2;

      // Calculate scaling to cover ellipse
      const avatarAspect = avatar.width / avatar.height;
      const ellipseAspect = ellipseW / ellipseH;

      let drawWidth, drawHeight;
      if (avatarAspect > ellipseAspect) {
        drawHeight = ellipseH;
        drawWidth = avatar.width * (ellipseH / avatar.height);
      } else {
        drawWidth = ellipseW;
        drawHeight = avatar.height * (ellipseW / avatar.width);
      }

      const dx = ellipseX - drawWidth / 2;
      const dy = ellipseY - drawHeight / 2;

      // Draw avatar inside ellipse
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ellipseX, ellipseY, ellipseRadiusX, ellipseRadiusY, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, dx, dy, drawWidth, drawHeight);
      ctx.restore();

      // Draw template over everything
      ctx.drawImage(template, 0, 0);

      // Write username under "Class: 24/7" (adjust position as needed)
      ctx.font = 'bold 30px Arial';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'left';
      ctx.fillText(userName, 270, 355); // Adjust x/y if needed

      const buffer = canvas.toBuffer('image/png');
      await conn.sendMessage(chatId, {
        image: buffer,
        caption: `📄 Horny License issued to @${target.split('@')[0]}`,
        mentions: [target]
      }, { quoted: m });

    } catch (err) {
      console.error('[Horny License]', err);
      await conn.sendMessage(chatId, { text: '❌ Error generating license.' }, { quoted: m });
    }
  }
};
