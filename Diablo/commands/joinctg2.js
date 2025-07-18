module.exports = {
  name: 'joinctg',
  desc: 'Join the game and get your Tropical Ticket',
  groupOnly: false,

  async run(msg, { conn }) {
    const user = msg.key.participant || msg.key.remoteJid;
    const chatId = msg.key.remoteJid;

    // Check if already joined
    if (registeredPlayers.has(user)) {
      await conn.sendMessage(chatId, { text: '⚠️ You have already joined the game. Please wait for it to start.' }, { quoted: msg });
      return;
    }

    // Check if lobby full
    if (registeredPlayers.size >= MIN_PLAYERS) {
      await conn.sendMessage(chatId, { text: '🚫 The game lobby is full. Please wait for the next game.' }, { quoted: msg });
      return;
    }

    // Register player with current CET/CEST time
    const now = new Date();
    const joinTimeStr = now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' });
    registeredPlayers.set(user, { joinedAt: joinTimeStr });

    // Save updated game data (make sure saveGameData() is available globally or imported)
    await saveGameData();

    // Send DM with ticket info + mentions user
    await conn.sendMessage(user, {
      text:
`🍹 *Tropical Ticket Booked!* 🌺

🧑 Passenger: *@${user.split('@')[0]}*
📅 Reservation Time: *${joinTimeStr}*

🌴 You’re now aboard the *Summer Starliner*, gliding across constellations and seafoam dreams...

🌕 *Whispers say*: _“When moonlight drowns the mango sky, the voyage shall begin.”_

🧳 Joined: *${registeredPlayers.size}* / ${MIN_PLAYERS}`,
      mentions: [user]
    });

    // Optionally send a GIF/video after the text
    await conn.sendMessage(user, {
      video: { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.mp4' },
      caption: 'Welcome aboard the Summer Starliner!'
    });
    
    // Confirm join in group chat
    await conn.sendMessage(chatId, { text: `✅ @${user.split('@')[0]} has joined the game! (${registeredPlayers.size}/${MIN_PLAYERS})` }, { quoted: msg, mentions: [user] });
  }
};
