/* .setclanpp  – reply to an image; owner/vice only */
const fs   = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const clans= require('../db/clans');

module.exports={
  name:'clansetpp',
  async run(msg,{conn}){
    const chat=msg.key.remoteJid, me=msg.key.participant||chat;
    const clan=clans.clanOf(me);
    if(!clan) return conn.sendMessage(chat,{text:'❌ Not in a clan.'},{quoted:msg});
    if(!(clan.owner===me||clan.vice===me)) return conn.sendMessage(chat,{text:'❌ Only owner/vice.'},{quoted:msg});

    const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if(!q) return conn.sendMessage(chat,{text:'Reply to an image.'},{quoted:msg});

    const dir=path.join('data','clanpp'); fs.mkdirSync(dir,{recursive:true});
    const file=path.join(dir,`${clan.id}.jpg`);
    const stream=await downloadContentFromMessage(q,'image');
    let buff=Buffer.alloc(0); for await(const c of stream) buff=Buffer.concat([buff,c]);
    fs.writeFileSync(file,buff); clan.logo=file; clans.saveClan(clan);
    conn.sendMessage(chat,{text:'✅ Clan logo updated.'},{quoted:msg});
  }
};
