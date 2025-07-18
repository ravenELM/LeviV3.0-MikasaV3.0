const fetch = require('node-fetch');

module.exports = {
  name: 'weather',
  aliases: [],
  description: 'Get current weather for a city',

  /**
   * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   * @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[] }} ctx
   */
  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;

    if (args.length === 0) {
      return conn.sendMessage(chatId, { text: '❌ Please provide a city name. Example: .weather London' }, { quoted: msg });
    }

    const city = args.join(' ');
    const apiKey = 'YOUR_OPENWEATHERMAP_API_KEY'; // Get your API key at https://openweathermap.org/api

    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`);
      if (!res.ok) throw new Error('City not found');

      const data = await res.json();

      const weatherDesc = data.weather[0].description;
      const temp = data.main.temp;
      const humidity = data.main.humidity;
      const windSpeed = data.wind.speed;

      const weatherMsg = `🌤️ Weather in *${data.name}*:\n` +
        `Condition: ${weatherDesc}\n` +
        `Temperature: ${temp}°C\n` +
        `Humidity: ${humidity}%\n` +
        `Wind Speed: ${windSpeed} m/s`;

      await conn.sendMessage(chatId, { text: weatherMsg }, { quoted: msg });
    } catch (error) {
      await conn.sendMessage(chatId, { text: '❌ Could not fetch weather info. Please check the city name.' }, { quoted: msg });
    }
  }
};
