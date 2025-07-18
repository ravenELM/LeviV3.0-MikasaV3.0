const clans = require('../db/clans');
const db    = require('../db/economy');

module.exports = {
  name: 'myclan',
  async run(msg, { conn }) {
    const chat = msg.key.remoteJid;
    const me   = msg.key.participant || msg.key.remoteJid;
    const clan = clans.clanOf(me);

    if (!clan) {
      return conn.sendMessage(chat, {
        text: '❌ You are not in a clan.'
      }, { quoted: msg });
    }

    const wealth  = clan.members.reduce((a, j) => a + db.getBalance(j), 0).toLocaleString();
    const members = clan.members.map(j => `• @${j.split('@')[0]}`).join('\n');
    const mentions = [clan.owner, clan.vice ?? '', ...clan.members];

    const caption = `🏰 *${clan.name}*\n` +
      `ID: ${clan.id}\n` +
      `Owner: @${clan.owner.split('@')[0]}\n` +
      `Vice : ${clan.vice ? ('@' + clan.vice.split('@')[0]) : '—'}\n` +
      `Members (${clan.members.length}/${clans.MAX_MEMBERS}):\n${members}\n\n` +
      `Slogan: ${clan.slogan || '—'}\n` +
      `💰 Wealth: *${wealth}* coins`;

    if (clan.logo) {
      // Send single image + caption message
      await conn.sendMessage(chat, {
        image: { url: clan.logo },
        caption,
        mentions
      }, { quoted: msg });
    } else {
      // No logo: just send text message
      await conn.sendMessage(chat, {
        text: caption,
        mentions
      }, { quoted: msg });
    }
  }
};
