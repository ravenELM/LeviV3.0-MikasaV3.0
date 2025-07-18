module.exports = {
  name: 'poll',
  desc: 'Create a WhatsApp poll. Usage: .poll Question;Option1;Option2;...',
  async run(msg, { conn, args }) {
    if (!args.length) {
      return conn.sendMessage(msg.key.remoteJid, { text: '⚠️ Usage: .poll Question;Option1;Option2;...' }, { quoted: msg });
    }

    const input = args.join(' ');
    const parts = input.split(';').map(p => p.trim()).filter(Boolean);

    if (parts.length < 2) {
      return conn.sendMessage(msg.key.remoteJid, { text: '❌ You need at least a question and 1 option, Baka!' }, { quoted: msg });
    }

    if (parts.length > 13) {
      return conn.sendMessage(msg.key.remoteJid, { text: '❌ Maximum 12 options allowed, Baka!' }, { quoted: msg });
    }

    const question = parts[0];
    const pollOptions = parts.slice(1).map(opt => ({ name: opt }));

    try {
      await conn.sendMessage(msg.key.remoteJid, {
        pollCreateMessage: {
          name: question,
          options: pollOptions,
        }
      }, { quoted: msg });
    } catch (e) {
      console.error('Poll send error:', e);
      await conn.sendMessage(msg.key.remoteJid, { text: '❌ Failed to create poll, Baka!' }, { quoted: msg });
    }
  }
};
