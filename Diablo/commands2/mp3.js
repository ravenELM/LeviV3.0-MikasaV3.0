const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
  name: 'mp3',
  run: async (m, { conn }) => {
    const chatId = m.key.remoteJid;

    if (!m.message || !m.message.videoMessage) {
      await conn.sendMessage(chatId, { text: '❌ Please reply to a video message with the .mp3 command.' }, { quoted: m });
      return;
    }

    try {
      await conn.sendMessage(chatId, { text: '⏳ Converting video to mp3, please wait...' }, { quoted: m });

      // Download video to temp file
      const buffer = await conn.downloadMediaMessage(m);
      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
      const videoPath = path.join(tempDir, 'temp_video.mp4');
      const audioPath = path.join(tempDir, 'output_audio.mp3');

      fs.writeFileSync(videoPath, buffer);

      // Convert video to mp3 with ffmpeg
      await new Promise((resolve, reject) => {
        exec(`ffmpeg -i "${videoPath}" -vn -ar 44100 -ac 2 -b:a 192k "${audioPath}" -y`, (error) => {
          if (error) return reject(error);
          resolve();
        });
      });

      // Send mp3 audio
      const audioBuffer = fs.readFileSync(audioPath);
      await conn.sendMessage(chatId, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: 'converted.mp3'
      }, { quoted: m });

      // Clean up temp files
      fs.unlinkSync(videoPath);
      fs.unlinkSync(audioPath);

    } catch (err) {
      console.error(err);
      await conn.sendMessage(chatId, { text: '❌ Failed to convert video to mp3.' }, { quoted: m });
    }
  }
};
