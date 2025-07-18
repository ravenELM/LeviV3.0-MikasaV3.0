const fs     = require('fs');
const db     = require('../db/economy');
const config = require('../config');

const MAX_BET = 60_000; // Max allowed bet
const COOLDOWN_MS = 30_000;
const WARN_LIMIT = 3;

// In-memory cooldown and warn tracking for gamble
const gambleCooldowns = {};
const gambleWarns = {};

module.exports = {
  name: 'gamble',
  aliases: ['g', 'gb'],
  description: 'Gamble coins (only works in enabled groups)',

  async run(msg, { conn, args, ownerIDs, mods }) {
    const from   = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const isOwner = ownerIDs.includes(sender);
    const isMod = mods && mods.includes(sender);

    /* ── 1. Casino‑group gate ───────────────────────────── */
    const allowedFile = './data/allowedGambleGroup.json';
    let allowed = false;
    if (fs.existsSync(allowedFile)) {
      const data = JSON.parse(fs.readFileSync(allowedFile));
      allowed = data.enabled && data.groupId === from;
    }
    if (!allowed) {
      return conn.sendMessage(from, {
        text: '⚠️ Gambling is only allowed in the casino group.\nCasino: https://tinyurl.com/2hffahu2'
      }, { quoted: msg });
    }

    // Cooldown and warning logic (owners get warned but not banned, mods/players can be banned)
    const cdKey = sender;
    if (gambleCooldowns[cdKey] && Date.now() - gambleCooldowns[cdKey] < COOLDOWN_MS) {
      gambleWarns[cdKey] = (gambleWarns[cdKey] || 0) + 1;
      const warnCount = gambleWarns[cdKey];
      const left = WARN_LIMIT - warnCount;
      const wait = Math.ceil((COOLDOWN_MS - (Date.now() - gambleCooldowns[cdKey])) / 1000);

      let warnMsg = `────⬡⚠WARNING⚠⬡────\n`;
      warnMsg += `├▢ USER : @${sender.split('@')[0]}\n`;
      warnMsg += `├▢ COUNT : ${warnCount}/${WARN_LIMIT}\n`;
      warnMsg += `├▢ WARN LIMIT : ${WARN_LIMIT}\n`;
      warnMsg += `├▢ LEFT : ${left} Warning${left !== 1 ? 's' : ''}\n`;
      warnMsg += `╰────────────────\n`;
      warnMsg += `\nPlease stop spamming!\nPlease wait ${wait}s before using .gamble again.\n`;
      warnMsg += `You have ${WARN_LIMIT} warns before getting banned.`;

      await conn.sendMessage(from, {
        text: warnMsg,
        mentions: [sender]
      }, { quoted: msg });

      // Only ban if not owner, and only if warn limit reached
      if (!isOwner && warnCount >= WARN_LIMIT) {
        // Only ban mods and regular users, not owners
        await conn.sendMessage(from, {
          text: `🚫 @${sender.split('@')[0]} has been *banned* for spamming .gamble!`,
          mentions: [sender]
        }, { quoted: msg });
        // Place your ban logic here (e.g., call your bans.banUser(sender))
        gambleWarns[cdKey] = 0;
      }
      return;
    }
    gambleCooldowns[cdKey] = Date.now();

    /* ── 2. Validate amount and direction ───────────────── */
    if (!args[0] || !args[1]) {
      return conn.sendMessage(from,
        { text: '❌ Invalid usage. Example: *.gamble 100 left*' }, { quoted: msg });
    }
    const amount = Number(args[0]);
    if (!Number.isInteger(amount) || amount <= 0) {
      return conn.sendMessage(from,
        { text: '❌ Invalid amount. Use a positive integer.' }, { quoted: msg });
    }
    if (amount > MAX_BET) {
      return conn.sendMessage(from,
        { text: `⚠️ The maximum bet is *${MAX_BET.toLocaleString()}* coins, Baka!` }, { quoted: msg });
    }

    // Direction/message (required, but not used in logic)
    const direction = args.slice(1).join(' ').trim();
    if (!direction) {
      return conn.sendMessage(from,
        { text: '❌ Invalid usage. Example: *.gamble 100 left*' }, { quoted: msg });
    }

    /* ── 3. Balance check ──────────────────────────────── */
    const balance = db.getBalance(sender);
    if (balance < amount) {
      return conn.sendMessage(from,
        { text: '❌ You don’t have enough coins, Baka!' }, { quoted: msg });
    }

    /* ── 4. Roll the gamble ────────────────────────────── */
    const win  = Math.random() < 0.3; // 20% chance to win
    const diff = win ? amount : -amount;
    db.addBalance(sender, diff);

    /* ── 5. Text result ────────────────────────────────── */
    const result = win
      ? `🎉 You *won* ${amount.toLocaleString()} coins!\nYour move: ${direction}`
      : `😢 You *lost* ${amount.toLocaleString()} coins.\nYour move: ${direction}`;

    return conn.sendMessage(from, { text: result }, { quoted: msg });
  }
};