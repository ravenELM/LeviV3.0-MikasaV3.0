// commands/tagadmin.js
const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name: 'admins',
  aliases: ['tagadmins', 'admins'],
  groupOnly: true,
  description: 'Tag all group admins',

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;

    // Only works in group chats
    if (!chatId.endsWith('@g.us')) {
      return conn.sendMessage(chatId, { text: '❌ This command only works in group chats!' }, { quoted: msg });
    }

    try {
      const metadata = await conn.groupMetadata(chatId);
      const admins = metadata.participants.filter(
        p => p.admin === 'admin' || p.admin === 'superadmin'
      );

      if (admins.length === 0) {
        return conn.sendMessage(chatId, { text: 'No admins found in this group!' }, { quoted: msg });
      }

      // Compose mentions text
      let text = `👑 Group Admins:\n`;
      const mentions = [];

      admins.forEach(admin => {
        const id = norm(admin.id);
        mentions.push(admin.id);
        text += `- @${id}\n`;
      });

      await conn.sendMessage(chatId, { text, mentions }, { quoted: msg });

    } catch (error) {
      console.error(error);
      conn.sendMessage(chatId, { text: '❌ Failed to fetch admins, Baka!' }, { quoted: msg });
    }
  }
};
