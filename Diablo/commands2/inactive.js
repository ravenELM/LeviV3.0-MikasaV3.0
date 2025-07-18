const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');
const DAY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// This should be the same messageLog from activity command (import or share it)
const messageLog = {}; // <-- In your app, this should be shared or imported from activity.js

// You still need to call recordActivity(msg) on every message to populate messageLog

module.exports = {
  name: 'inactive',
  aliases: ['inactive', 'iaus'],
  groupOnly: true,
  description: 'Show users who have NOT sent any messages in the last 7 days',

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;
    if (!chatId.endsWith('@g.us')) {
      return conn.sendMessage(chatId, { text: '❌ This command only works in groups.' }, { quoted: msg });
    }

    const now = Date.now();
    const weekAgo = now - DAY_MS;
    const metadata = await conn.groupMetadata(chatId);
    if (!metadata || !metadata.participants) {
      return conn.sendMessage(chatId, { text: '⚠️ Could not get group participants.' }, { quoted: msg });
    }

    const entries = messageLog[chatId] || [];

    // Get a Set of users who sent messages in last 7 days
    const activeUsers = new Set(
      entries
        .filter(({ timestamp }) => timestamp >= weekAgo)
        .map(({ sender }) => sender)
    );

    // All group members normalized
    const allMembers = metadata.participants.map(p => norm(p.id));

    // Find members NOT in activeUsers
    const inactiveUsers = allMembers.filter(user => !activeUsers.has(user));

    if (inactiveUsers.length === 0) {
      return conn.sendMessage(chatId,
        { text: '🎉 Everyone has been active in the last 7 days!' },
        { quoted: msg }
      );
    }

    // Format list with names
    let text = `🔕 *Inactive members in the last 7 days:*\n\n`;
    inactiveUsers.forEach(user => {
      const participant = metadata.participants.find(p => norm(p.id) === user);
      const name = participant?.notify || participant?.vname || user;
      text += `- ${name}\n`;
    });

    await conn.sendMessage(chatId, { text }, { quoted: msg });
  }
};
