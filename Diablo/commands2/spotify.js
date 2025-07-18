const axios = require('axios');

const validSpotifyUrl = url => /https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/.test(url);

const getSpotifyToken = async (clientId, clientSecret) => {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');

  const res = await axios.post('https://accounts.spotify.com/api/token', params, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return res.data.access_token;
};

module.exports = {
  name: 'spotify',
  aliases: ['sp'],
  description: 'Get Spotify track info and preview audio',
  async run(m, { conn, args, config }) {
    const chatId = m.key.remoteJid;
    const input = args.join(' ').trim();

    if (!input || !validSpotifyUrl(input)) {
      return conn.sendMessage(chatId, {
        text: '❌ Please provide a valid Spotify track URL.\nExample:\n`.spotify https://open.spotify.com/track/abc123...`'
      }, { quoted: m });
    }

    try {
      const clientId = config.spotifyClientId;
      const clientSecret = config.spotifyClientSecret;

      if (!clientId || !clientSecret) {
        return conn.sendMessage(chatId, { text: '❌ Spotify client ID and secret are not configured.' }, { quoted: m });
      }

      // Get access token
      const token = await getSpotifyToken(clientId, clientSecret);

      // Extract track ID from URL
      const trackId = input.match(/track\/([a-zA-Z0-9]+)/)[1];

      // Fetch track info
      const { data } = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Prepare message
      const artists = data.artists.map(a => a.name).join(', ');
      const previewUrl = data.preview_url;

      let msg = `🎵 *${data.name}*\n👤 *Artist(s):* ${artists}\n💽 *Album:* ${data.album.name}\n📅 *Released:* ${data.album.release_date}\n🔗 ${input}`;

      await conn.sendMessage(chatId, { text: msg }, { quoted: m });

      if (previewUrl) {
        // Download preview audio and send as audio message
        const audioBuffer = (await axios.get(previewUrl, { responseType: 'arraybuffer' })).data;

        await conn.sendMessage(chatId, {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          ptt: false,
          fileName: `${data.name}.mp3`
        }, { quoted: m });
      } else {
        await conn.sendMessage(chatId, { text: '⚠️ No preview audio available for this track.' }, { quoted: m });
      }

    } catch (error) {
      console.error('[Spotify Downloader]', error);
      await conn.sendMessage(chatId, { text: '❌ Failed to fetch Spotify track info.' }, { quoted: m });
    }
  }
};
