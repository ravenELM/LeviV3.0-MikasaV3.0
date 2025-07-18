const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
  name: 'yt',
  aliases: ['yt1080p', 'ytvideo'],
  description: 'Download YouTube video in 1080p MP4',
  async run(m, { conn, args }) {
    const chatId = m.key.remoteJid;

    if (!args.length) {
      return conn.sendMessage(chatId, {
        text: '❌ Provide a YouTube link or search.\nExample: `.yt Alan Walker Faded`',
      }, { quoted: m });
    }

    const query = args.join(' ').trim();
    let video;

    try {
      // Search or parse URL
      if (ytdl.validateURL(query)) {
        const info = await ytdl.getInfo(query);
        video = { url: query, title: info.videoDetails.title, duration: Number(info.videoDetails.lengthSeconds) };
      } else {
        const result = await yts(query);
        if (!result.videos.length) throw new Error('No results');
        const vid = result.videos[0];
        video = { url: vid.url, title: vid.title, duration: vid.seconds };
      }

      if (video.duration > 600) {
        return conn.sendMessage(chatId, { text: '⚠️ Video too long. Max: 10 mins (600 sec).' }, { quoted: m });
      }

      const tempDir = tmpdir();
      const videoPath = path.join(tempDir, `yt_vid_${Date.now()}.mp4`);
      const audioPath = path.join(tempDir, `yt_aud_${Date.now()}.mp4`);
      const outputPath = path.join(tempDir, `yt_final_${Date.now()}.mp4`);

      // Download video-only (1080p)
      const videoStream = ytdl(video.url, { quality: '137' }); // 137 = 1080p MP4
      const audioStream = ytdl(video.url, { quality: '140' }); // 140 = best audio m4a

      await Promise.all([
        new Promise((res, rej) => videoStream.pipe(fs.createWriteStream(videoPath)).on('finish', res).on('error', rej)),
        new Promise((res, rej) => audioStream.pipe(fs.createWriteStream(audioPath)).on('finish', res).on('error', rej))
      ]);

      // Merge using ffmpeg
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(videoPath)
          .input(audioPath)
          .videoCodec('copy')
          .audioCodec('aac')
          .format('mp4')
          .save(outputPath)
          .on('end', resolve)
          .on('error', reject);
      });

      const finalSize = fs.statSync(outputPath).size;
      const maxSize = 100 * 1024 * 1024; // ~100 MB

      if (finalSize > maxSize) {
        await conn.sendMessage(chatId, {
          text: '⚠️ Final video is too large to send on WhatsApp (>100MB).',
        }, { quoted: m });
      } else {
        await conn.sendMessage(chatId, {
          video: fs.readFileSync(outputPath),
          caption: `🎬 *${video.title}* (1080p)`,
          mimetype: 'video/mp4',
        }, { quoted: m });
      }

      // Cleanup
      [videoPath, audioPath, outputPath].forEach(p => fs.existsSync(p) && fs.unlinkSync(p));

    } catch (err) {
      console.error('[yt1080p error]', err);
      await conn.sendMessage(chatId, {
        text: '❌ Failed to download or process the video.',
      }, { quoted: m });
    }
  }
};
