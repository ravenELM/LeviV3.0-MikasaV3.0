module.exports = {
  name: 'cardguide',
  run: async (msg, { conn }) => {
    const chatId = msg.key.remoteJid;

    const mediaUrl = 'https://media.tenor.com/M7ddw6ExFkEAAAPo/levi.mp4'; // Replace with your actual gif/mp4 URL

    const guideText = `
*📜 Anime Card Game Guide 📜*

*📝 Overview:*
This is a collectible card game where players can obtain, trade, and compete using anime-themed cards.
Cards spawn randomly in groups with over 30+ members where cards are enabled. Players must claim the cards by solving a captcha and spending in-game currency.

*🎴 Card Tiers & Prices:*
\`\`\`
Tier 1  | 900 - 2000
Tier 2  | 2200 - 4000
Tier 3  | 5000 - 7000
Tier 4  | 9000 - 14000
Tier 5  | 24000 - 31000
Tier 6  | 69000 - 80000
Tier S  | 84000 - 100000
\`\`\`

*💰 How to Get Money:*
- *.daily* – Collect daily rewards.
- *.bonus* – Receive additional rewards.
- *Weekly Gamble* – Participate in the Raven-Bots Casino group to win money.

*📦 Claiming Cards:*
1. A card spawns randomly in a group with over 30 members.
2. A captcha is sent along with the card.
3. Enter the correct captcha and pay the required money to claim the card.
4. The claimed card is added to your *collection*.

*🛠️ Managing Your Cards:*

*.cl*   - View all your collected cards
*.ad*   - Add a card to your deck (up to 12 cards)
*.deck* - View your deck
*.sc*   - Sell your card to another user

*🏆 Leaderboards & Events:*
- *Leaderboards*: Track rankings for *Money* and *Cards*.
- *Events & Auctions*: Participate in *Raven-Bots Auction*, where rare event cards are auctioned. The highest bidder wins the card.

*🔥 Fusion System:*

_4x Tier 1 cards → Tier 2 card_
_4x Tier 2 cards → Tier 3 card_
_4x Tier 3 cards → Tier 4 card_
_4x Tier 4 cards → Tier 5 card_
_4x Tier 5 cards → Tier 6 card_
_3x Tier 6 cards → Tier S card_

*🚫 Rules & Regulations:*
❌ *Scamming is not allowed*; violators may be permanently banned.
❌ *Alting (using multiple accounts) is prohibited*. Violators will be blacklisted and must pay a fine in in-game currency/items to get unblacklisted.

⚡ Follow the rules to ensure a fair and enjoyable gaming experience. Happy collecting! 🎴
`;

    try {
      // Download media and send
      const axios = require('axios');
      const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      const mediaBuffer = Buffer.from(mediaResponse.data, 'binary');

      await conn.sendMessage(chatId, {
        video: mediaBuffer,
        caption: guideText,
        gifPlayback: true
      }, { quoted: msg });
    } catch (err) {
      console.error('Error sending cardguide:', err);
      await conn.sendMessage(chatId, { text: guideText }, { quoted: msg });
    }
  }
};
