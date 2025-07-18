const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
  name: 'play',
  aliases: ['p'],
  description: 'Play a song from YouTube',
  async run(m, { conn, args }) {
    try {
      if (!args.length) {
        return await conn.sendMessage(m.key.remoteJid, { text: '❌ Please provide a search term!' }, { quoted: m });
      }

      const query = args.join(' ');
      const r = await yts(query);
      const video = r.videos.length > 0 ? r.videos[0] : null;

      if (!video) {
        return await conn.sendMessage(m.key.remoteJid, { text: '❌ No results found!' }, { quoted: m });
      }

      // Prepare info message
      const msgText = 
`🎵 *${video.title}*
⏳ Duration: ${video.timestamp}
👀 Views: ${video.views.toLocaleString()}
👍 Likes: ${video.likes?.toLocaleString() || 'N/A'}
🔗 Link: ${video.url}`;

      // Send thumbnail + info message
      await conn.sendMessage(m.key.remoteJid, {
        image: { url: video.thumbnail },
        caption: msgText
      }, { quoted: m });

      // Get audio stream from video URL
      const stream = ytdl(video.url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
      });

      // Convert to voice note buffer
      const { PassThrough } = require('stream');
      const streamPass = new PassThrough();
      const chunks = [];

      stream.pipe(streamPass);

      // Use ffmpeg to convert to opus (voice note compatible)
      await new Promise((resolve, reject) => {
        ffmpeg(streamPass)
          .audioCodec('libopus')
          .format('opus')
          .on('error', err => reject(err))
          .on('end', () => resolve())
          .pipe()
          .on('data', chunk => chunks.push(chunk));
      });

      // Combine chunks into a single buffer
      const audioBuffer = Buffer.concat(chunks);

      // Send as voice note (push-to-talk)
      await conn.sendMessage(m.key.remoteJid, {
        audio: audioBuffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true
      }, { quoted: m });

    } catch (e) {
      console.error('❌ play error:', e);
      await conn.sendMessage(m.key.remoteJid, { text: '❌ Error playing the video.' }, { quoted: m });
    }
  }
};
