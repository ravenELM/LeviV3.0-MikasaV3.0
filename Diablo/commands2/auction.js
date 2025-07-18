const fs = require('fs');
const path = require('path');
const { ownerIDs } = require('../config');

const claimedPath = path.join(__dirname, '..', 'data', 'claimed.json');
const auctionPath = path.join(__dirname, '..', 'data', 'auction.json');
const economyPath = path.join(__dirname, '..', 'data', 'economy.json');

if (!fs.existsSync(claimedPath)) fs.writeFileSync(claimedPath, '{}');
if (!fs.existsSync(auctionPath)) fs.writeFileSync(auctionPath, '{}');
if (!fs.existsSync(economyPath)) fs.writeFileSync(economyPath, '{}');

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'auction',
  desc: 'Start an auction (owner only)',
  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const sender = (msg.key.participant || chatId).split(':')[0];

    if (!ownerIDs.includes(sender)) {
      return conn.sendMessage(chatId, { text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*' }, { quoted: msg });
    }

    const index = parseInt(args[0]) - 1;
    const startPrice = parseInt(args[1]);

    if (isNaN(index) || isNaN(startPrice) || startPrice < 1) {
      return conn.sendMessage(chatId, { text: '⚠️ Usage: .auction <card_number> <starting_price>' }, { quoted: msg });
    }

    const claims = loadJSON(claimedPath);
    const myCards = claims[sender] || {};
    const myCardKeys = Object.keys(myCards);

    if (!myCardKeys[index]) {
      return conn.sendMessage(chatId, { text: '❌ Invalid card number.' }, { quoted: msg });
    }

    const currentAuction = loadJSON(auctionPath);
    if (currentAuction.active) {
      return conn.sendMessage(chatId, { text: '⚠️ There is already an active auction.' }, { quoted: msg });
    }

    const cardId = myCardKeys[index];
    const cardData = myCards[cardId];

    // Remove card from owner's claimed cards before auction
    delete claims[sender][cardId];
    saveJSON(claimedPath, claims);

    const auction = {
      active: true,
      cardId,
      card: cardData,
      owner: sender,
      startPrice,
      highestBid: 0,
      highestBidder: null,
      endsAt: Date.now() + 5 * 60 * 1000
    };

    saveJSON(auctionPath, auction);

    await conn.sendMessage(chatId, {
      text:
        `🎉 *Auction Started!*\n\n` +
        `🎴 Card: *${cardData.name}* (Tier ${cardData.tier})\n` +
        `💰 Starting Price: *${startPrice.toLocaleString()}*\n` +
        `🧩 Captcha: ${cardData.captcha}\n\n` +
        `Place your bid using *.bid <amount>*`,
      image: { url: cardData.img }
    }, { quoted: msg });

    // Set timeout to auto-end auction
    setTimeout(async () => {
      const endData = loadJSON(auctionPath);
      if (!endData.active) return;

      endData.active = false;
      saveJSON(auctionPath, endData);

      if (endData.highestBidder) {
        // Deduct winning bid amount from winner's economy balance
        const economy = loadJSON(economyPath);
        if (!economy[endData.highestBidder]) economy[endData.highestBidder] = { money: 0 };

        if (economy[endData.highestBidder].money >= endData.highestBid) {
          economy[endData.highestBidder].money -= endData.highestBid;
        } else {
          // Not enough money — you may want to handle this case differently
          // For now, just set money to 0
          economy[endData.highestBidder].money = 0;
        }
        saveJSON(economyPath, economy);

        // Transfer card to highest bidder
        const allClaims = loadJSON(claimedPath);
        if (!allClaims[endData.highestBidder]) allClaims[endData.highestBidder] = {};
        allClaims[endData.highestBidder][endData.cardId] = endData.card;
        saveJSON(claimedPath, allClaims);

        await conn.sendMessage(chatId, {
          text:
            `🏁 *Auction Ended!*\n\n` +
            `🏆 Winner: @${endData.highestBidder.split('@')[0]}\n` +
            `💰 Final Bid: *${endData.highestBid.toLocaleString()}*\n` +
            `🎴 Card: *${endData.card.name}*`,
          mentions: [endData.highestBidder]
        });
      } else {
        // Return card to owner
        const allClaims = loadJSON(claimedPath);
        if (!allClaims[endData.owner]) allClaims[endData.owner] = {};
        allClaims[endData.owner][endData.cardId] = endData.card;
        saveJSON(claimedPath, allClaims);

        await conn.sendMessage(chatId, {
          text: `⌛ Auction ended. No one bid.\nCard returned to the owner.`
        });
      }
    }, 5 * 60 * 1000);
  }
};
