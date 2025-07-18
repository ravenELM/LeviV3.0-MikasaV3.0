module.exports = {
  name: 'join',
  desc: 'Join a group via invite link (owner/mod only)',
  async run(msg, { conn, ownerIDs, mods }) {
    const sender = msg.key.participant || msg.key.remoteJid;
    if (![...ownerIDs, ...mods].includes(sender)) {
      return conn.sendMessage(msg.key.remoteJid, { text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*' }, { quoted: msg });
    }

    // Extract link from conversation or extendedTextMessage
    let link =
      (msg.message.conversation || '') ||
      (msg.message.extendedTextMessage?.text || '');

    // Support ".join <link>" or just the link
    link = link.split(' ').slice(1).join(' ').trim() || link.trim();

    if (!link || !link.includes('whatsapp.com/')) {
      return conn.sendMessage(msg.key.remoteJid, { text: 'Usage: .join <group link>' }, { quoted: msg });
    }
    const code = link.split('/').pop().split(' ')[0];
    try {
      const res = await conn.groupAcceptInvite(code);
      // Send GIF with cute welcome caption
      await conn.sendMessage(res, { 
        video: { url: 'https://media.tenor.com/a2ckSILufD4AAAPo/attack-on-titan-aot.mp4' }, 
        gifPlayback: true, 
        caption: `🌸 Arigato for inviting me! 🌸

I'm your new group assistant~
Type *.menu* to see all my powers!
Let's make this group even more fun together! (≧◡≦) ♡`
      });
    } catch (e) {
      await conn.sendMessage(msg.key.remoteJid, { text: '❌ Failed to join group.' }, { quoted: msg });
    }
  }
};