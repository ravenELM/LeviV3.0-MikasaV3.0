const fetch = require('node-fetch');
const { isPremium } = require('../lib/premium.js');

function getTextFromMessage(m) {
  return m.message?.conversation || m.message?.extendedTextMessage?.text || '';
}

module.exports = {
  name: 'ipstalker',
  aliases: ['ipinfo', 'iplookup'],
  description: 'Get approximate location info from an IP address (premium only)',
  run: async (m, { conn }) => {
    const senderId = (m.key.participant || m.key.remoteJid || '').split(':')[0];

    if (!isPremium(senderId)) {
      return conn.sendMessage(m.key.remoteJid, { text: '🚫 This command is for premium users only.' }, { quoted: m });
    }

    const text = getTextFromMessage(m);
    const args = text.trim().split(/\s+/).slice(1);

    if (args.length === 0) {
      return conn.sendMessage(m.key.remoteJid, { text: '❌ Please provide an IP address.' }, { quoted: m });
    }

    const ip = args[0];

    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,zip,lat,lon,isp,org,as,query`);
      const data = await response.json();

      if (data.status !== 'success') {
        return conn.sendMessage(m.key.remoteJid, { text: `⚠️ Error: ${data.message}` }, { quoted: m });
      }

      const locationInfo = `
📍 IP: ${data.query}
🌐 Country: ${data.country}
🏞 Region: ${data.regionName}
🏙 City: ${data.city}
📮 ZIP: ${data.zip}
🧭 Latitude: ${data.lat}
🧭 Longitude: ${data.lon}
📡 ISP: ${data.isp}
🏢 Organization: ${data.org}
🔢 AS: ${data.as}
      `.trim();

      return conn.sendMessage(m.key.remoteJid, { text: locationInfo }, { quoted: m });
    } catch (error) {
      console.error('IPStalker fetch error:', error);
      return conn.sendMessage(m.key.remoteJid, { text: '❌ Failed to fetch IP info.' }, { quoted: m });
    }
  }
};
