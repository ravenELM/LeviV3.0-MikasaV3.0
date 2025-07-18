// promote
const clans=require('../db/clans');
module.exports={
  name:'promotecvice', aliases:['promotevice'],
  async run(msg,{conn}){
    const chat=msg.key.remoteJid, me=msg.key.participant||chat;
    const mention=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];
    if(!mention.length) return conn.sendMessage(chat,{text:'Tag user.'},{quoted:msg});
    const target=mention[0];
    const clan=clans.clanOf(me);
    if(!clan||clan.owner!==me) return conn.sendMessage(chat,{text:'Only owner.'},{quoted:msg});
    if(!clan.members.includes(target)) return conn.sendMessage(chat,{text:'Not in clan.'},{quoted:msg});
    clan.vice=target; clans.saveClan(clan);
    conn.sendMessage(chat,{text:`✅ @${target.split('@')[0]} is now Vice.` ,mentions:[target]},{quoted:msg});
  }
};