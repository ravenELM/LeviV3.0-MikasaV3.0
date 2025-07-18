const fs        = require('fs');
const path      = require('path');
const cardsDB   = require('../db/cards');
const { ownerIDs } = require('../config');

/* folders that contain images / webm */
const TIERS = ['t1','t2','t3','t4','t5','t6','ts'];

const rand    = a => a[Math.floor(Math.random()*a.length)];
const randID  = () => [...Array(6)]
                      .map(_=>'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*36)])
                      .join('');

module.exports = {
  name     : 'spawn',
  aliases  : ['scard'],
  ownerOnly: true,

  async run (m,{conn}) {

    /* owner gate */
    const sender = (m.key.participant || m.key.remoteJid).split(':')[0];
    if (!ownerIDs.includes(sender))
      return conn.sendMessage(m.key.remoteJid,{text:'❌ Owner only.'},{quoted:m});

    /* pick random file */
    const base = path.join(process.cwd(),'cards');
    const tierDir = rand(TIERS.filter(t=>fs.existsSync(path.join(base,t))));
    const files   = fs.readdirSync(path.join(base,tierDir))
                      .filter(f=>/\.(png|jpe?g|webm)$/i.test(f));
    if(!files.length)
      return conn.sendMessage(m.key.remoteJid,{text:'⚠️ No card images found.'},{quoted:m});

    const file  = rand(files);               // e.g. card1-2.png
    const meta  = require('../data/cards.json')[file.replace(/\.\w+$/,'')] || {};
    const card  = {
      id   : randID(),                                   // CAPTCHA
      name : meta.name  || file.replace(/\.\w+$/,''),
      tier : meta.tier  || tierDir.replace('t',''),      // 1..6 or s
      price: meta.price || 10000,
      file : path.join('cards', tierDir, file)           // relative
    };

    cardsDB.setSpawn(card);      // overwrite previous spawn

    const msg =
`🎉 *New Card Spawned!* 🎉

🌟 Card  : *${card.name}*
💎 Tier  : *${card.tier}*
🆔 ID    : *${card.id}*
💰 Price : *$${card.price.toLocaleString()}*

Reply with  *.getc ${card.id}*  to claim.`;
    const buff = fs.readFileSync(card.file);
    const isVid = /\.webm$/i.test(card.file);

    await conn.sendMessage(
      m.key.remoteJid,
      isVid ? { video: buff, gifPlayback:true, caption:msg }
            : { image: buff, caption:msg }
    );
  }
};
