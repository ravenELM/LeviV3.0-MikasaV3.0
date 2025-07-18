// commands/activity.js

const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

// In-memory store for demo, reset on bot restart!
// Better to use persistent storage in real use
const messageLog = {};

/**
 * Call this from your main message event handler for every message received:
 * recordActivity(msg)
 */
function recordActivity(msg) {
  const chatId = msg.key.remoteJid;
  const sender = norm(msg.key.participant || msg.key.remoteJid);
  const now = Date.now();

  if (!chatId.endsWith('@g.us')) return; // only group chats

  if (!messageLog[chatId]) messageLog[chatId] = [];

  // Push { sender, timestamp }
  messageLog[chatId].push({ sender, timestamp: now });

  // Optional: prune old entries older than 7 days to keep memory clean
  const weekAgo = now - 1 * 24 * 60 * 60 * 1000;
  messageLog[chatId] = messageLog[chatId].filter(entry => entry.timestamp >= weekAgo);
}

module.exports = {
  name: 'activity',
  aliases: ['activitylog', 'aus'],
  groupOnly: true,
  description: 'Show message counts per user in last 7 days',

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;

    if (!chatId.endsWith('@g.us')) {
      return conn.sendMessage(chatId, { text: '❌ This command only works in groups.' }, { quoted: msg });
    }

    const entries = messageLog[chatId] || [];
    if (entries.length === 0) {
      return conn.sendMessage(chatId, { text: 'No activity recorded in the last 7 days.' }, { quoted: msg });
    }

    // Count messages per sender
    const counts = {};
    entries.forEach(({ sender }) => {
      counts[sender] = (counts[sender] || 0) + 1;
    });

    // Sort users by message count descending
    const sortedUsers = Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);

    // Fetch group metadata for usernames
    const metadata = await conn.groupMetadata(chatId);

    let text = `📊 *Activity in the last 7 days*:\n\n`;
    for (const [user, count] of sortedUsers) {
      // find contact name in group participants or fallback to user id
      const participant = metadata.participants.find(p => norm(p.id) === user);
      const name = participant?.notify || participant?.vname || user;
      text += `- ${name}: ${count} message${count > 1 ? 's' : ''}\n`;
    }

    await conn.sendMessage(chatId, { text }, { quoted: msg });
  }
};

module.exports.recordActivity = recordActivity;
