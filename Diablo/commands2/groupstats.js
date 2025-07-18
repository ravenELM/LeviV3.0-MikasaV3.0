module.exports = {
  name: 'groupstats',
  aliases: ['gcinfo', 'gcstats'],
  description: 'Shows current group info: title, description & member count',
  groupOnly: true, // Only works in groups

  async run(msg, { conn }) {
    const groupId = msg.key.remoteJid;

    try {
      const metadata = await conn.groupMetadata(groupId);

      const title = metadata.subject || 'No title';
      const description = metadata.desc?.toString() || 'No description set.';
      const memberCount = metadata.participants.length;
      

      const text = `
👥 *Group Info*

🏷️ *Title:* ${title}
📊 *Members:* ${memberCount}
📝 *Description:* ${description}

      `.trim();

      await conn.sendMessage(groupId, { text }, { quoted: msg });

    } catch (error) {
      console.error('Error fetching group metadata:', error);
      await conn.sendMessage(groupId, {
        text: '❌ Failed to fetch group info. Make sure I\'m an admin!',
      }, { quoted: msg });
    }
  }
};
