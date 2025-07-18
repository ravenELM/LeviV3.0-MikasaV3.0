module.exports = {
  name: 'inspect',
  desc: 'Inspect a player role',
  groupOnly: false, // Can be used anywhere, but ideally in game context

  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const from = msg.key.fromMe ? conn.user.jid : msg.key.participant || msg.key.remoteJid;

    // Check if game has started and roles are assigned
    if (!global.playersRoles) {
      return await conn.sendMessage(chatId, { text: '❌ No game is currently running.' }, { quoted: msg });
    }

    if (!args || args.length === 0) {
      return await conn.sendMessage(chatId, { text: '❗ Usage: .inspect @user' }, { quoted: msg });
    }

    // Extract mentioned user ID (WhatsApp JID)
    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mention || mention.length === 0) {
      return await conn.sendMessage(chatId, { text: '❗ Please tag a user to inspect.' }, { quoted: msg });
    }

    const targetUser = mention[0];

    // Check if target user is in game
    if (!global.playersRoles.has(targetUser)) {
      return await conn.sendMessage(chatId, { text: '❌ This player is not part of the game.' }, { quoted: msg });
    }

    // Get actual role of target user
    const { role } = global.playersRoles.get(targetUser);

    // Show 'Mechanic' instead of 'Killer' when inspected
    let displayedRole = role;
    if (role.toLowerCase() === 'killer') {
      displayedRole = 'Mechanic';
    }

    const text = `🕵️‍♂️ Inspection Result:\nUser: @${targetUser.split('@')[0]}\nRole: *${displayedRole.toUpperCase()}*`;

    await conn.sendMessage(chatId, {
      text,
      contextInfo: { mentionedJid: [targetUser] }
    }, { quoted: msg });
  }
};
