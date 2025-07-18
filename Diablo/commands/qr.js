const QRCode = require('qrcode');

module.exports = {
  name: 'qr',
  description: 'Generate a QR code from text or URL',
  async run(m, { conn, args }) {
    const chatId = m.key.remoteJid;
    const input = args.join(' ').trim();

    if (!input) {
      return conn.sendMessage(chatId, { text: '❌ Please provide text or a link to generate a QR code.\nExample:\n.qr https://example.com' }, { quoted: m });
    }

    try {
      const dataUrl = await QRCode.toDataURL(input);
      const base64Data = dataUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      await conn.sendMessage(chatId, {
        image: buffer,
        caption: `🔗 QR Code for:\n${input}`
      }, { quoted: m });
    } catch (error) {
      console.error('[qr]', error);
      await conn.sendMessage(chatId, { text: '❌ Failed to generate QR code.' }, { quoted: m });
    }
  }
};
