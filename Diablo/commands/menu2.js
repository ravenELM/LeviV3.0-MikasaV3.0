const fs = require('fs');
const os = require('os');
const path = require('path');

function formatUptime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${h}h ${m}m ${sec}s`;
}

module.exports = {
  name: 'menu',
  aliases: ['help', 'h'],
  description: 'Shows the full menu, Baka!',
  ownerOnly: false,
  modOnly: false,
  groupOnly: true,

  /** 
   * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg 
   * @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[] }} ctx 
   */
  async run(msg, { conn }) {
    const uptime = process.uptime();
    const ram = process.memoryUsage().rss / 1024 / 1024;
    const cpus = os.cpus();
    const cpuUsage = (cpus.reduce((a, b) => a + b.times.user, 0) / cpus.length / 1000).toFixed(2);

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '📜', key: msg.key }
    });

    let userName = msg.pushName || '';
    if (!userName && conn.getName) {
      userName = await conn.getName(msg.key.participant || msg.key.remoteJid);
    }
    if (!userName) userName = (msg.key.participant || msg.key.remoteJid).split('@')[0];

    const menu = `
╭────────⬡ 𝚳𝚰𝚱𝚨𝐒𝚨 ⬡─────────
├▢ User: ${userName}
├▢ Creator: 𝕽𝖆𝖛𝖊𝖓
├▢ Version: 2.0
├▢ Prefix: .
├▢ Commands: 329
├▢ CPU Usage: ${cpuUsage} sec
├▢ RAM: ${ram.toFixed(2)} MB
├▢ Uptime: ${formatUptime(uptime)}
╰─────────────────────────────
╭────────⬡MODERATION⬡────────
├▢ warn,rwarn,tagall,gstats
├▢ promote,demote,dev,joinreq
├▢ test,rules,addbadword
├▢ mods,del,cwarn,kick
├▢ support,info,stalk  
├▢ ping,report,poll,link
├▢ close,open,purge,admins
├▢ antilink,say,weather 
├▢ ginfo,mute,unmute,bot
├▢ activity,bots,gopen
├▢ setgname,setwelcome,
├▢ setleave,setdesc,setgpfp

╭───────────⬡OWNER⬡──────────
├▢ bot,botoff,onbot,restart 
├▢ addbot,delbot,ban,unban
├▢ banlist,stop,setleave,myid
├▢ setwelcome,bots,join,id 
├▢ leave,userclogs,antibword
├▢ addbadword,antilink,mode
├▢ changebotname,ongamble
├▢ offgamble,acteconomy
├▢ deacteconomy, ongamble
├▢ offgamble,prefix,moneydata
├▢ getsession,actcards,deactcards
├▢ gcprune,addgift,addmod,delmod
├▢ arise,broadcast,creategc

╭──────────⬡GAMES⬡──────────
├▢ tictactoe,rps,8ball,dice
├▢ gw,gn

╭─────────⬡ECONOMY⬡─────────
├▢ ongamble,offgamble,gamble
├▢ slot,transfer,daily,bal 
├▢ lottery,payday,give
├▢ acteconomy,deacteconomy 

╭────────⬡RPG SYSTEM⬡────────
├▢ shop,buy,inv,giftcode,gift  
├▢ cook,fridge,animal,buyfood 
├▢ foodshop,animalshop,feed
├▢ buyanimal,myanimal

╭────────⬡CARD GAME⬡─────────
├▢ getc,collection,usercl
├▢ viewcard,allowner,tier
├▢ transfercard,auction, 
├▢ acceptcard,bid,sellcard
├▢ lbcards

╭────────⬡CLAN SYSTEM⬡────────
├▢ createclan,joinclan,lclan 
├▢ clansetpp,clanlist,myclan 
├▢ promotevice,demotevice
├▢ addcmember,kickcuser

╭──────⬡AUDIO MODIFIER⬡───────
├▢ bass,blown,deep,reverse 
├▢ fast,fat,nightcore,slow 
├▢ robot,earrape,smooth,
├▢ reverb,chipmunk,whisper
├▢ distorsion,squirrel
├▢ underwater,echo,3dsound, 
├▢ 8dsound,nightclub 

╭────────⬡REACTIONS⬡─────────
├▢ bite,awoo,blush,bonk,pat
├▢ bully,cringe,cuddle,hug
├▢ handhold,happy,highfive 
├▢ lick,poke,smile,cry,kill 
├▢ leaving,fuck,wink,wave
├▢ glomp,dance
           
╭──────────⬡ INFO ⬡──────────
├▢ info,help,owner,report
├▢ mods,support,setwname
├▢ mesglb,stalk,banreview
├▢ ping,dev,lb,

╭───────────⬡ JOB ⬡───────────
├▢ rmod,becomemod,joinreq,
├▢ cmdidea,ban,unban,banlist

╭───────────⬡ GPT ⬡───────────
├▢ levi,mikasa

╭───────────⬡ GFX ⬡───────────
├▢ dsize,say,gaycheck,generate
├▢ horny,hack

╭────────⬡ DOWNLADER ⬡────────
├▢ yt,insta,tiktok,spotify,pint

╭───────────⬡ HACK ⬡───────────
├▢ hackreact,gcbug,crashbot,laggc
├▢ locator,device,locate,ipstalker

╭────────⬡CONVERTER⬡─────────
├▢ take,toimg,sticker,take,
├▢ q,stalk,uinfo,tourl,aivoice
├▢ qr,mediafire,mp3
`.trim();

    const videoPath = path.join(__dirname,  '..', 'assets', 'mikasa.mp4'); // Place your .mp4 here
    let videoBuffer;

    try {
      videoBuffer = fs.readFileSync(videoPath);
    } catch (err) {
      console.error('❌ Menu video not found:', err.message);
      return await conn.sendMessage(msg.key.remoteJid, {
        text: '⚠ Menu video file not found in assets/menu.mp4.',
      }, { quoted: msg });
    }

    await conn.sendMessage(
      msg.key.remoteJid,
      {
        video: videoBuffer,
        gifPlayback: true,
        caption: menu,
      },
      { quoted: msg }
    );
  }
};
