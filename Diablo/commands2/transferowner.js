const clans=require('../db/clans');
module.exports={
  name:'transferowner',
  async run(msg,{conn}){
    const chat=msg.key.remoteJid, me=msg.key.participant||chat;
    const mention=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];
    if(!mention.length) return conn.sendMessage(chat,{text:'Tag new owner.'},{quoted:msg});
    const target=mention[0];
    const clan=clans.clanOf(me);
    if(!clan||clan.owner!==me) return conn.sendMessage(chat,{text:'Only owner.'},{quoted:msg});
    if(!clan.members.includes(target)) return conn.sendMessage(chat,{text:'Target not in clan.'},{quoted:msg});
    clan.owner=target; clans.saveClan(clan);
    conn.sendMessage(chat,{text:`👑 Ownership transferred to @${target.split('@')[0]}.`,mentions:[target]},{quoted:msg});
  }
};
