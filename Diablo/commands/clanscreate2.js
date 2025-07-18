/* .createclan <name> | <optional slogan>  – cost: 50 mil */
const clans = require('../db/clans');
const db    = require('../db/economy');

module.exports = {
  name: 'clanscreate',
  aliases: ['newclan'],
  async run(msg,{conn,args}) {
    const chat = msg.key.remoteJid;
    const me   = msg.key.participant || chat;
    if (!args.length) return conn.sendMessage(chat,{text:'Usage: *.createclan CoolName | Best slogan*'},{quoted:msg});

    if (clans.clanOf(me))
      return conn.sendMessage(chat,{text:'❌ You are already in a clan.'},{quoted:msg});

    const wallet = db.getBalance(me);
    if (wallet < clans.CLAN_FEE)
      return conn.sendMessage(chat,{text:`❌ Need ${clans.CLAN_FEE.toLocaleString()} coins.`},{quoted:msg});

    const txt      = args.join(' ').split('|');
    const name     = txt[0].trim().slice(0,30);
    const slogan   = (txt[1]||'').trim().slice(0,60);
    const clan     = clans.createClan(me,name,slogan);
    db.addBalance(me,-clans.CLAN_FEE);

    conn.sendMessage(chat,{text:
`🎉 Clan *${clan.name}* created!\nID: *${clan.id}*\nMembers: 1/${clans.MAX_MEMBERS}\nSlogan: ${clan.slogan||'—'}`},{quoted:msg});
  }
};
