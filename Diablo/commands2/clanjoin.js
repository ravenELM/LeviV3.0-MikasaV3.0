/* .joinclan <ID> – ask to join, owner/vice must .addclanmember you */
const clans = require('../db/clans');

module.exports={
  name:'clanjoin',
  async run(msg,{conn,args}){
    const chat=msg.key.remoteJid, me=msg.key.participant||chat;
    const id=args[0]; if(!id) return conn.sendMessage(chat,{text:'Usage: *.joinclan <ID>*'},{quoted:msg});
    if(clans.clanOf(me)) return conn.sendMessage(chat,{text:'❌ Already in a clan.'},{quoted:msg});

    const clan=clans.getClan(id);
    if(!clan) return conn.sendMessage(chat,{text:'❌ No such clan.'},{quoted:msg});
    if(clan.members.length>=clans.MAX_MEMBERS) return conn.sendMessage(chat,{text:'❌ Clan full.'},{quoted:msg});

    if(!clan.requests.includes(me)){ clan.requests.push(me); clans.saveClan(clan); }

    conn.sendMessage(chat,{text:`📨 Join request sent to clan *${clan.name}*.`},{quoted:msg});
    conn.sendMessage(clan.owner, { text:`📥 @${me.split('@')[0]} wants to join clan *${clan.name}*.\nAccept with *.addclanmember @user*`, mentions:[me] });
  }
};
