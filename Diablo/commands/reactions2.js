/* commands/group-reactions.js
   One file – many anime‑style reaction commands
   Usage:  .wink @user | .hug @user | .kill @user  …etc               */

const reactionMap = {
 bite:     { verb: 'bit',         url: 'https://media.tenor.com/5mVQ3ffWUTgAAAPo/anime-bite.mp4' },
  awoo:     { verb: 'howled at',   url: 'https://media.tenor.com/Hab16KybZZIAAAPo/horo-holo.mp4' },
  blush:    { verb: 'blushed at',  url: 'https://media.tenor.com/lezPddWRr64AAAPo/anime-ehehe.mp4' },
  bonk:     { verb: 'bonked',      url: 'https://media.tenor.com/D6Ln3UPAdKcAAAPo/bonk-anime.mp4' },
  bully:    { verb: 'bullied',     url: 'https://media.tenor.com/v0zNBL6W3DMAAAPo/bleach-ichigo-kurosaki.mp4' },
  cringe:   { verb: 'cringed at',  url: 'https://media.tenor.com/ZWop2tkzsakAAAPo/magirevo-anis-shy.mp4' },
  cry:      { verb: 'cried with',  url: 'https://media.tenor.com/ZURDvrz5D38AAAPo/feliz-cumplea%C3%B1os.mp4' },
  cuddle:   { verb: 'cuddled',     url: 'https://media.tenor.com/pVWXJ0Vj_2UAAAPo/sunshine-love-live.mp4' },
  dance:    { verb: 'danced with', url: 'https://media.tenor.com/d-lz7Nu6X2oAAAPo/bocchi-the-rock-bocchi.mp4' },
  glomp:    { verb: 'glomped',     url: 'https://media.tenor.com/uDV2sKbe5dgAAAPo/hug-glomp.mp4' },
  handhold: { verb: 'held hands',  url: 'https://media.tenor.com/fMwRtJSFFGIAAAPo/lain-alice.mp4' },
  happy:    { verb: 'is happy with', url: 'https://media.tenor.com/89QSIUPhqBkAAAPo/anime-girl-happy.mp4' },
  highfive: { verb: 'high‑fived',  url: 'https://media.tenor.com/ia0eAUSTgHAAAAPo/high-five-high5.mp4' },
  hug:      { verb: 'hugged',      url: 'https://media.tenor.com/nwxXREHNog0AAAPo/hug-anime.mp4' },
  kill:     { verb: '… uh, eliminated', url: 'https://media.tenor.com/SIrXZQWK9WAAAAPo/me-friends.mp4' },
  kiss:     { verb: 'kissed',      url: 'https://media.tenor.com/YHxJ9NvLYKsAAAPo/anime-kiss.mp4' },
  lick:     { verb: 'licked',      url: 'https://media.tenor.com/zoPOIvogEpwAAAPo/lick.mp4' },
  nom:      { verb: 'nibbled on',  url: 'https://media1.tenor.com/m/twZc5kf2RT0AAAAC/kanna-kobayashi.gif' },
  pat:      { verb: 'patted',      url: 'https://media.tenor.com/fro6pl7src0AAAPo/hugtrip.mp4' },
  poke:     { verb: 'poked',       url: 'https://media.tenor.com/iSumE3JoYokAAAPo/vn-visual.mp4' },
  shinobu:  { verb: 'loved Shinobu', url: 'https://path.to/your/gif/shinobu.mp4' },
  slap:     { verb: 'slapped',     url: 'https://media.tenor.com/NPKC-nRM1lcAAAPo/bleach-anime.mp4' },
  smile:    { verb: 'smiled at',   url: 'https://media.tenor.com/Hy-KN1Vg1BIAAAPo/girl-anime.mp4' },
  smug:     { verb: 'looked smugly at', url: 'https://media.tenor.com/amMMuaTS1bsAAAPo/mutsumi-mutsumi-yozakura.mp4' },
  wave:     { verb: 'waved at',    url: 'https://media.tenor.com/_g11bRHLxxAAAAPo/anime-anime-girl.mp4' },
  wink:     { verb: 'winked at',   url: 'https://media.tenor.com/Cjw0fXX7LwwAAAPo/kushima-kamome.mp4' },
  fuck:     { verb: '… gave a rude gesture to', url: 'https://media.tenor.com/wJcdUCbtTYIAAAPo/a-girl-and-her-guard-dog-keiya.mp4' },
  leaving:  { verb: 'is leaving',  url: 'https://media.tenor.com/qymrjWaJKKwAAAPo/lain-serial-experiments-lain.mp4' },
  // add more below ⬇️
};

module.exports = {
  /* The file registers *all* keys in reactionMap as aliases */
  name: 'reactions',
  aliases: Object.keys(reactionMap),
  groupOnly: true,

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   *  @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[], prefix: string }} ctx */
  async run(msg, { conn, args, prefix }) {

    /* ── 1. Safe guards for weird message layouts ───────── */
    const chatId   = msg.key?.remoteJid;
    if (!chatId) return;                    // shouldn’t happen
    const senderId = msg.key?.participant || msg.key?.remoteJid;

    /* ── 2. Work out WHICH reaction alias was used ─────── */
    const body = (
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        ''
    ).trim();

    const invoked = body.slice(prefix.length).split(/\s+/)[0].toLowerCase();
    const reaction = reactionMap[invoked];
    if (!reaction) return;                 // no match → silently ignore

    /* ── 3. Resolve target user (mention or reply) ─────── */
    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [];
    const replied = msg.message?.extendedTextMessage?.contextInfo?.participant
                  ? [msg.message.extendedTextMessage.contextInfo.participant] : [];

    const targetId = (mention[0] || replied[0] || senderId); // default to self
    const targetTag = targetId.split('@')[0];

    /* ── 4. Pretty caption ─────────────────────────────── */
    const senderTag = senderId.split('@')[0];
    const caption   = `@${senderTag} ${reaction.verb} @${targetTag}`;

    /* ── 5. Send video or GIF reaction ─────────────────── */
    try {
      await conn.sendMessage(chatId, {
        video: { url: reaction.url },
        gifPlayback: true,
        caption,
        mentions: [senderId, targetId]
      }, { quoted: msg });
    } catch (err) {
      console.error(`[REACTION:${invoked}] send error`, err);
      await conn.sendMessage(chatId,
        { text: '❌ Failed to fetch reaction GIF.' }, { quoted: msg });
    }
  }
};
