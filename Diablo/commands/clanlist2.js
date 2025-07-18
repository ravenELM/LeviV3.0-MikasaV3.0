/* .clanlist – show all clans */
const clans=require('../db/clans');
module.exports={
  name:'clanlist',
  async run(msg,{conn}){
    const chat=msg.key.remoteJid;
    const list=clans.allClans();
    if(!list.length) return conn.sendMessage(chat,{text:'No clans yet.'},{quoted:msg});
    const txt=list.map(c=>`• *${c.name}*  (ID: ${c.id}) – ${c.members.length}/${clans.MAX_MEMBERS}`).join('\n');
    conn.sendMessage(chat,{text:`🏘️ *Existing Clans*\n${txt}`},{quoted:msg});
  }
};
