const cardsDB = require('../db/cards');
const metaCards = require('../data/cards.json');

module.exports = {
  name: 'atodeck',
  aliases: ['deckadd', 'deckpush'],
  desc: 'Add a card from your collection to your deck by its number. Usage: .addtodeck <nr>',
  async run(m, { conn, args }) {
    const chatId = m.key.remoteJid;
    const senderId = (m.key.participant || chatId).split(':')[0];
    const nr = parseInt(args[0]);

    if (isNaN(nr) || nr < 1) {
      return conn.sendMessage(chatId, { text: '❌ Usage: .addtodeck <number>\nExample: .addtodeck 2' }, { quoted: m });
    }

    // Get user's collection
    const collection = cardsDB.getCollection(senderId);
    if (!collection || collection.length < nr) {
      return conn.sendMessage(chatId, { text: '❌ Invalid card number in your collection.' }, { quoted: m });
    }

    const card = collection[nr - 1];
    if (!card) {
      return conn.sendMessage(chatId, { text: '❌ Card not found in your collection.' }, { quoted: m });
    }

    // Add to deck
    cardsDB.addToDeck(senderId, card.id);

    // Optional: Show card info
    const meta = metaCards[card.img] || metaCards[card.id] || card;
    await conn.sendMessage(chatId, {
      text: `✅ Added *${meta.name || card.id}* (ID: ${card.id}) to your deck!`,
    }, { quoted: m });
  }
};