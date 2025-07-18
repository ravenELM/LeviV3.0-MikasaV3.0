const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'mediafire',
  run: async (m, { conn }) => {
    const chatId = m.key.remoteJid;
    const text = (m.message.conversation || m.message.extendedTextMessage?.text || '').trim();

    const args = text.split(' ');
    if (args.length < 2) {
      await conn.sendMessage(chatId, { text: '❌ Please provide a Mediafire link.\nUsage: .mediafir <link>' }, { quoted: m });
      return;
    }

    const mediafireLink = args[1];

    if (!mediafireLink.includes('mediafire.com')) {
      await conn.sendMessage(chatId, { text: '❌ That does not look like a Mediafire link.' }, { quoted: m });
      return;
    }

    try {
      await conn.sendMessage(chatId, { text: '⏳ Downloading APK, please wait...' }, { quoted: m });

      // Get Mediafire page HTML
      const response = await axios.get(mediafireLink);
      const html = response.data;

      // Extract direct download link (usually starts with https://download...)
      const dlLinkMatch = html.match(/href="(https?:\/\/download[^"]+\.apk)"/);
      if (!dlLinkMatch) {
        await conn.sendMessage(chatId, { text: '❌ Could not find direct download link on Mediafire page.' }, { quoted: m });
        return;
      }

      const downloadUrl = dlLinkMatch[1];

      // Download APK file
      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
      const apkPath = path.join(tempDir, 'mediafire_download.apk');

      const writer = fs.createWriteStream(apkPath);
      const downloadResponse = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'stream',
      });
      downloadResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Send APK file to chat
      await conn.sendMessage(chatId, {
        document: fs.readFileSync(apkPath),
        mimetype: 'application/vnd.android.package-archive',
        fileName: 'downloaded.apk',
        caption: 'Here is your APK from Mediafire.'
      }, { quoted: m });

      fs.unlinkSync(apkPath); // cleanup

    } catch (error) {
      console.error('Error in mediafire download:', error);
      await conn.sendMessage(chatId, { text: '❌ Failed to download or send the APK.' }, { quoted: m });
    }
  }
};
