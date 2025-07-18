// commands/group-bass.js
const fs   = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

/* small helper to stream‑>buffer */
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks);
}

module.exports = {
  name: 'bass',
  aliases: ['bassboost'],
  desc : 'Bass‑boost the replied audio/voice note',

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg */
  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;

    /* must be a reply to an audio/ptt */
    const quotedCtx = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = quotedCtx?.quotedMessage;
    if (!quotedMsg || !(quotedMsg.audioMessage || quotedMsg.voiceMessage)) {
      return conn.sendMessage(chatId,
        { text: '⚠️ Reply to an *audio* or *voice note* then type *.bass*, Baka!' },
        { quoted: msg });
    }

    try {
      /* 1️⃣  download original media → buffer */
      const audioType  = quotedMsg.audioMessage ? 'audio' : 'audio';   // both are audio streams
      const stream     = await downloadContentFromMessage(
                           quotedMsg.audioMessage || quotedMsg.voiceMessage,
                           audioType
                         );
      const inputBuf   = await streamToBuffer(stream);

      /* 2️⃣  write temp input */
      const tempDir    = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
      const inFile     = path.join(tempDir, `in-${Date.now()}.mp3`);
      const outFile    = path.join(tempDir, `out-${Date.now()}.mp3`);
      fs.writeFileSync(inFile, inputBuf);

      /* 3️⃣  FFmpeg bass‑boost (gain +20 dB) */
      await new Promise((res, rej) => {
        ffmpeg(inFile)
          .audioFilter('bass=g=20')          // boost the bass
          .output(outFile)
          .on('end', res)
          .on('error', rej)
          .run();
      });

      /* 4️⃣  send back */
      const boosted = fs.readFileSync(outFile);
      await conn.sendMessage(chatId, {
        audio: boosted,
        mimetype: 'audio/mp4',
        ptt: false                 // keep as normal audio; set true if you want PTT
      }, { quoted: msg });

      /* 5️⃣  clean temp */
      fs.unlinkSync(inFile);
      fs.unlinkSync(outFile);

    } catch (err) {
      console.error('[bass] error:', err);
      await conn.sendMessage(chatId,
        { text: '❌ Failed to process audio — is FFmpeg installed?' },
        { quoted: msg });
    }
  }
};
