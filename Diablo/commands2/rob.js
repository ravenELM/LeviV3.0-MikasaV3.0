const usersDB = require('../db/users'); // You need a users DB with balances

module.exports = {
  name: 'rob',
  desc: 'Attempt to rob another user. Usage: .rob @user',
  async run(m, { conn, args }) {
    const chatId = m.key.remoteJid;
    const senderId = (m.key.participant || chatId).split(':')[0] + '@s.whatsapp.net';

    // Get mentioned user
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!mentioned) {
      return conn.sendMessage(chatId, { text: '❌ Usage: .rob @user' }, { quoted: m });
    }
    if (mentioned === senderId) {
      return conn.sendMessage(chatId, { text: '❌ You cannot rob yourself!' }, { quoted: m });
    }

    // Get balances
    let senderBal = usersDB.getBalance(senderId) || 0;
    let targetBal = usersDB.getBalance(mentioned) || 0;



    // 50% chance to succeed
    if (Math.random() < 0.5) {
      // Fail: lose random amount (max 100)
      const loss = Math.min(senderBal, Math.floor(Math.random() * 100) + 1);
      usersDB.addBalance(senderId, -loss);
      return conn.sendMessage(chatId, {
        text: `💥 Robbery failed! You lost $${loss.toLocaleString()}!`,
        mentions: [senderId]
      }, { quoted: m });
    } else {
      // Success: steal random amount (max 30% of target, up to 500)
      const maxSteal = Math.min(Math.floor(targetBal * 0.3), 500);
      const amount = Math.floor(Math.random() * maxSteal) + 1;
      usersDB.addBalance(senderId, amount);
      usersDB.addBalance(mentioned, -amount);
      return conn.sendMessage(chatId, {
        text: `💸 Success! You robbed @${mentioned.split('@')[0]} for $${amount.toLocaleString()}!`,
        mentions: [senderId, mentioned]
      }, { quoted: m });
    }
  }
};