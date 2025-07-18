const axios = require('axios');

const apiToken = 'ewIeQeJxghTe8yqxKB0ZlFrHqqAS2nXydFPrgIlLahD4pbB3YlSjTR9e3Y7h'; // your TinyURL API token

module.exports = {
  name: 'tourl',
  aliases: ['shorturl', 'shorten'],
  description: 'Shorten a long URL using TinyURL',
  async run(m, { conn, args }) {
    const chatId = m.key.remoteJid;
    const input = args.join(' ').trim();

    if (!input) {
      return conn.sendMessage(chatId, {
        text: '🔗 Please provide a URL to shorten.\nExample: `.tourl https://www.example.com`',
      }, { quoted: m });
    }

    // Optional alias support: .tourl <url> | <alias>
    const [rawUrl, customAlias] = input.split('|').map(s => s.trim());
    const longUrl = rawUrl;

    // Simple URL validation
    const urlRegex = /^(https?:\/\/)?([^\s$.?#].[^\s]*)$/i;
    if (!urlRegex.test(longUrl)) {
      return conn.sendMessage(chatId, {
        text: '❌ Invalid URL. Please enter a valid URL starting with http:// or https://',
      }, { quoted: m });
    }

    try {
      const body = {
        url: longUrl,
        domain: 'tinyurl.com',
      };

      if (customAlias) {
        body.alias = customAlias;
      }

      const response = await axios.post(
        'https://api.tinyurl.com/create',
        body,
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const shortUrl = response.data?.data?.tiny_url;

      if (!shortUrl) {
        throw new Error('Shortened URL missing in response.');
      }

      await conn.sendMessage(chatId, {
        text: `🔗 Shortened URL:\n${shortUrl}`,
      }, { quoted: m });

    } catch (err) {
      console.error('[tourl]', err.response?.data || err.message);

      let errorMessage = '❌ Failed to shorten URL.';

      if (err.response?.data?.errors?.[0]?.message) {
        errorMessage += `\nReason: ${err.response.data.errors[0].message}`;
      }

      await conn.sendMessage(chatId, {
        text: errorMessage,
      }, { quoted: m });
    }
  }
};
