const db = require('../db/economy');
const config = require('../config');

module.exports = {
  name: 'give',
  ownerOnly: true,
  async run(msg, { conn, args }) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!config.ownerIDs.includes(sender)) {
      return conn.sendMessage(from, { text: '❌ You are not authorized to use this command, Baka!' });
    }

    if (args.length < 2) {
      return conn.sendMessage(from, { text: 'Usage: .give <amount> @user' });
    }

    const amount = parseInt(args[0], 10);
    if (isNaN(amount) || amount <= 0) {
      return conn.sendMessage(from, { text: '❌ Please enter a valid positive amount.' });
    }

    const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mentioned || mentioned.length === 0) {
      return conn.sendMessage(from, { text: '❌ Please tag the user to give money to.' });
    }
    const userId = mentioned[0];

    // Add the amount to the mentioned user's balance
    await db.addBalance(userId, amount);

    await conn.sendMessage(from, {
      text: `💰 Added ${amount} coins to @${userId.split('@')[0]}'s wallet.`,
      mentions: [userId]
    });
  }
};
