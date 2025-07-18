/* .moneycountry – total coins of your clan */
const clans=require('../db/clans'); const db=require('../db/economy');
module.exports={
  name:'moneycountry',
  async run(msg,{conn}){
    const chat=msg.key.remoteJid, me=msg.key.participant||chat;
    const clan=clans.clanOf(me);
    if(!clan) return conn.sendMessage(chat,{text:'❌ Not in a clan.'},{quoted:msg});
    const total=clan.members.reduce((t,j)=>t+db.getBalance(j),0);
    conn.sendMessage(chat,{text:`💰 Clan wealth: *${total.toLocaleString()}* coins`},{quoted:msg});
  }
};
