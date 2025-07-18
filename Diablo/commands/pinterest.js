const puppeteer = require('puppeteer');

module.exports = {
  name: 'pint',
  aliases: ['pinterest'],
  description: 'Search Pinterest and return up to 5 images (using Puppeteer)',
  async run(m, { conn, args }) {
    const chatId = m.key.remoteJid;
    const query = args.join(' ').trim();

    if (!query) {
      return conn.sendMessage(chatId, {
        text: '❌ Please provide a search term.\nExample: `.pint anime aesthetic`'
      }, { quoted: m });
    }

    try {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      // Go to Pinterest search page
      const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Wait for images to load
      await page.waitForSelector('img[src^="https://i.pinimg.com/"]', { timeout: 10000 });

      // Extract image URLs
      const imgUrls = await page.$$eval('img[src^="https://i.pinimg.com/"]', imgs =>
        imgs.map(img => img.src)
      );

      await browser.close();

      if (imgUrls.length === 0) {
        return conn.sendMessage(chatId, {
          text: '⚠️ No Pinterest images found.'
        }, { quoted: m });
      }

      const top = imgUrls.slice(0, 5);
      for (const imgUrl of top) {
        await conn.sendMessage(chatId, { image: { url: imgUrl }, caption: `🔍 ${query}` }, { quoted: m });
      }
    } catch (err) {
      console.error('[Pinterest Puppeteer]', err);
      await conn.sendMessage(chatId, {
        text: '❌ Failed to fetch Pinterest images.'
      }, { quoted: m });
    }
  }
};
