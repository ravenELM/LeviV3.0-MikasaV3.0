const axios = require('axios');

module.exports = {
  name: 'aivoice',
  description: 'Convert text to AI voice audio (no API key needed)',
  async run(m, { conn, args }) {
    const chatId = m.key.remoteJid;
    const text = args.join(' ').trim();

    if (!text) {
      return conn.sendMessage(chatId, { text: '❌ Please provide some text to convert to voice.' }, { quoted: m });
    }

    try {
      // Request body for ttsmp3.com
      const payload = {
        msg: text,
        lang: 'Joey', // US English male voice, other options available like 'Joanna', 'Ivy', etc.
        source: 'ttsmp3'
      };

      const response = await axios.post('https://ttsmp3.com/makemp3_new.php', new URLSearchParams(payload).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.Error === 0) {
        const audioUrl = response.data.URL;

        // Fetch audio buffer from audioUrl
        const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
        const audioBuffer = Buffer.from(audioResponse.data, 'binary');

        await conn.sendMessage(chatId, {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          ptt: false
        }, { quoted: m });

      } else {
        throw new Error(response.data.Text);
      }

    } catch (error) {
      console.error('[aivoice]', error);
      await conn.sendMessage(chatId, { text: '❌ Failed to convert text to voice.' }, { quoted: m });
    }
  }
};
