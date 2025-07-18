const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const nodeHtmlToImage = require('node-html-to-image');

module.exports = {
  name: 'q',
  aliases: ['quote'],
  desc: 'Quote replied message as WhatsApp-style sticker with pfp',

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

    if (!quoted || !contextInfo?.participant) {
      return conn.sendMessage(chatId, { text: '⚠️ Reply to a message to quote it.' }, { quoted: msg });
    }

    const jid = contextInfo.participant;
    const text =
      quoted.conversation ||
      quoted.extendedTextMessage?.text ||
      quoted.imageMessage?.caption ||
      quoted.videoMessage?.caption ||
      (quoted.stickerMessage ? '[sticker]' :
       quoted.imageMessage ? '[photo]' :
       quoted.videoMessage ? '[video]' :
       '[media]');

    // Get profile picture or fallback
    let pfpUrl;
    try {
      pfpUrl = await conn.profilePictureUrl(jid, 'image');
    } catch {
      pfpUrl = 'https://i.ibb.co/Sn9RZ9K/avatar.png'; // fallback
    }

    // Get sender name
    let senderName = jid.split('@')[0];
    try {
      const contacts = await conn.onWhatsApp(jid);
      if (contacts?.[0]?.notify) senderName = contacts[0].notify;
    } catch {}

    const html = `
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: #e5ddd5;
              width: 512px;
              height: 512px;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .quote {
              display: flex;
              background: #ffffff;
              padding: 20px;
              border-radius: 18px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.15);
              max-width: 480px;
              width: 90%;
            }
            .avatar {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              margin-right: 16px;
              flex-shrink: 0;
              background: #ccc;
              object-fit: cover;
            }
            .text {
              display: flex;
              flex-direction: column;
              max-width: 380px;
              word-wrap: break-word;
              white-space: pre-wrap;
            }
            .name {
              font-weight: 600;
              color: #075E54;
              font-size: 18px;
              margin-bottom: 8px;
            }
            .message {
              font-size: 22px;
              color: #222;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div class="quote">
            <img class="avatar" src="${pfpUrl}" />
            <div class="text">
              <div class="name">${escapeHtml(senderName)}</div>
              <div class="message">${escapeHtml(text)}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const tmpPng = path.join(os.tmpdir(), `q_${Date.now()}.png`);
      const puppeteerChromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; // CHANGE if different

      await nodeHtmlToImage({
        output: tmpPng,
        html,
        puppeteerArgs: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          executablePath: puppeteerChromePath,
        },
      });

      const stickerBuffer = fs.readFileSync(tmpPng);

      await conn.sendMessage(chatId, { sticker: stickerBuffer }, { quoted: msg });

      fs.unlinkSync(tmpPng);
    } catch (err) {
      console.error('quote sticker error:', err);
      await conn.sendMessage(chatId, { text: '❌ Failed to generate quote.' }, { quoted: msg });
    }
  },
};

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m =>
    m === '&' ? '&amp;' :
    m === '<' ? '&lt;' :
    m === '>' ? '&gt;' :
    m === '"' ? '&quot;' :
    '&#039;'
  );
}
