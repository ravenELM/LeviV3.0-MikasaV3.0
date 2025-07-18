// commands/group-nightcore.js
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const ffmpeg  = require('fluent-ffmpeg');
const fs      = require('fs');
const path    = require('path');
const { tmpdir } = require('os');

/* helper ▸ descarcă mesajul citat în buffer */
async function quotedToBuffer(quoted) {
  const type   = Object.keys(quoted)[0];                       // audioMessage / videoMessage
  const stream = await downloadContentFromMessage(quoted[type], 'audio');
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks);
}

/* helper ▸ aplică filtrul FFmpeg şi întoarce buffer opus */
function applyFilter(inputBuf, ffFilter) {
  const inFile  = path.join(tmpdir(), `in_${Date.now()}.ogg`);
  const outFile = path.join(tmpdir(), `out_${Date.now()}.ogg`);
  return new Promise((res, rej) => {
    fs.writeFileSync(inFile, inputBuf);
    ffmpeg(inFile)
      .audioFilters(ffFilter)
      .audioCodec('libopus')
      .format('opus')
      .save(outFile)
      .on('end', () => {
        const out = fs.readFileSync(outFile);
        fs.unlinkSync(inFile);
        fs.unlinkSync(outFile);
        res(out);
      })
      .on('error', rej);
  });
}

module.exports = {
  name     : 'distorsion',
  groupOnly: true,
  desc     : 'Nightcore‑ify a voice note (speed‑up & pitch‑up)',

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} m */
  async run(m, { conn }) {
    const chatId = m.key.remoteJid;
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted)
      return conn.sendMessage(chatId,
        { text: '⚠️ Reply to an audio for me to use nightcore!' },
        { quoted: m });

    try {
      /* 1. download */
      const bufIn  = await quotedToBuffer(quoted);

      /* 2. filtre Nightcore  (↑ tempo & pitch) */
      const ffFilter = 'acrusher=level_in=1:level_out=0.7:bits=8:mode=log:mix=0.5';
      const bufOut = await applyFilter(bufIn, ffFilter);

      /* 3. trimite rezultatul ca PTT */
      await conn.sendMessage(chatId, {
        audio   : bufOut,
        mimetype: 'audio/ogg; codecs=opus',
        ptt     : true
      }, { quoted: m });

    } catch (e) {
      console.error('Nightcore error:', e);
      await conn.sendMessage(chatId,
        { text: '❌ Something went wrong' },
        { quoted: m });
    }
  }
};
