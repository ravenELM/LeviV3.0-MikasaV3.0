/* .addclanmember @user – owner/vice approves pending req */
const clans = require('../db/clans');

module.exports={
  name:'addmemberc',
  aliases:['acceptclan'],
  async run(msg,{conn}){
    const chat=msg.key.remoteJid, me=msg.key.participant||chat;
    const mention=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];
    if(!mention.length) return conn.sendMessage(chat,{text:'Tag user to add.'},{quoted:msg});
    const target=mention[0];

    const clan=clans.clanOf(me);
    if(!clan) return conn.sendMessage(chat,{text:'❌ You don’t own a clan.'},{quoted:msg});
    const isBoss = (clan.owner===me||clan.vice===me);
    if(!isBoss) return conn.sendMessage(chat,{text:'❌ Only owner/vice.'},{quoted:msg});

    if(clan.members.length>=clans.MAX_MEMBERS) return conn.sendMessage(chat,{text:'❌ Clan full.'},{quoted:msg});
    if(!clan.requests.includes(target)) return conn.sendMessage(chat,{text:'No pending request.'},{quoted:msg});

    clan.members.push(target); clans.deleteRequest(clan,target);
    conn.sendMessage(chat,{text:`✅ @${target.split('@')[0]} added to *${clan.name}*.`,mentions:[target]},{quoted:msg});
  }
};
