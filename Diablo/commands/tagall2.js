// commands/tagall.js
module.exports = {
  name: 'tagall',
  aliases: ['hidetag','htag'],
  async run(msg, { conn, args }) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!from.endsWith('@g.us')) {
      return conn.sendMessage(from, { text: 'This command only works in groups, Baka!' }, { quoted: msg });
    }

    const metadata = await conn.groupMetadata(from);

    // Check if sender is admin
    const senderParticipant = metadata.participants.find(p => p.id === sender);
    if (!senderParticipant || (senderParticipant.admin !== 'admin' && senderParticipant.admin !== 'superadmin')) {
      return conn.sendMessage(from, { text: '❌ Only group admins can use this command.' }, { quoted: msg });
    }

    const mentionList = metadata.participants.map(p => p.id);
    const message = args.length ? args.join(' ') : '👥 Tagging everyone!';

    await conn.sendMessage(from, {
      text: message,
      mentions: mentionList
    });
  }
};
