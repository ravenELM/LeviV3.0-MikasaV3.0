// demote
const clans2=require('../db/clans');
module.exports={
  name:'demotecvice', aliases:['demotevice'],
  async run(msg,{conn}){
    const chat=msg.key.remoteJid, me=msg.key.participant||chat;
    const clan=clans2.clanOf(me);
    if(!clan||clan.owner!==me) return conn.sendMessage(chat,{text:'Only owner.'},{quoted:msg});
    clan.vice=null; clans2.saveClan(clan);
    conn.sendMessage(chat,{text:'✅ Vice role cleared.'},{quoted:msg});
  }
};