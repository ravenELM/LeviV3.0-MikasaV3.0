const fs = require('fs');
const path = require('path');
const db = require('../db/economy.js');

const auctionPath = path.join(__dirname, '..', 'data', 'auction.json');

module.exports = {
  name: 'bid',
  desc: 'Place a bid on the current auction',
  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const sender = (msg.key.participant || chatId).split(':')[0];

    const bidAmount = parseInt(args[0]);
    if (isNaN(bidAmount) || bidAmount < 1) {
      return conn.sendMessage(chatId, { text: '⚠️ Usage: .bid <amount>' }, { quoted: msg });
    }

    const auction = JSON.parse(fs.readFileSync(auctionPath));
    if (!auction.active) {
      return conn.sendMessage(chatId, { text: '❌ There is no active auction.' }, { quoted: msg });
    }

    if (sender === auction.owner) {
      return conn.sendMessage(chatId, { text: '❌ You can’t bid on your own auction.' }, { quoted: msg });
    }

    if (bidAmount <= auction.highestBid || bidAmount < auction.startPrice) {
      return conn.sendMessage(chatId, {
        text: `❌ Your bid must be higher than current bid: *${Math.max(auction.highestBid, auction.startPrice).toLocaleString()}*`
      }, { quoted: msg });
    }

    const userBal = db.getBalance(sender);
    if (userBal < bidAmount) {
      return conn.sendMessage(chatId, { text: '❌ You don’t have enough money to place this bid.' }, { quoted: msg });
    }

    auction.highestBid = bidAmount;
    auction.highestBidder = sender;
    fs.writeFileSync(auctionPath, JSON.stringify(auction, null, 2));

    await conn.sendMessage(chatId, {
      text: `✅ @${sender.split('@')[0]} placed a bid of *${bidAmount.toLocaleString()}*!`,
      mentions: [sender]
    });
  }
};
