module.exports = {
  name        : 'rules',
  aliases     : ['rule','rulz'],
  description : 'Shows all Raven-Bots rules with ban durations',
  ownerOnly   : false,
  modOnly     : false,
  groupOnly   : true,

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   *  @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[] }} ctx */
  async run(msg, { conn }) {
    await conn.sendMessage(msg.key.remoteJid, {
      react: {
        text: '📜',
        key: msg.key,
      }
    });

    const rulesText = `
╭─────⬡ RAVEN-BOTS RULES SUMMARY ⬡─────╮

1. GENERAL CONDUCT
• No harassment, threats, bullying, or personal attacks.
• No spamming bot, mods, owner DMs or groups.
• No unnecessary tagging of owner/mods.
• Report issues to moderators first, not owner.
• Messaging owner without valid reason is not allowed.
• No hacking or manipulating bot/mods/owner.

2. ECONOMY & TRADING
• No real-money trading of in-game items except official store.
• No multiple accounts to cheat rewards or economy.
• No selling/renting/transferring accounts.
• No exploiting card claims or economy.
• Mods can’t abuse powers for advantage.

3. CARD CLAIMING
• Users claim cards only during allowed times.
• Mods claim cards only in official groups, within 15 minutes of spawn.
• No unfair card claiming.

4. MODERATION
• Mods must enforce rules fairly, no scamming/harassment.
• Mods can’t ban/kick other mods without owner permission.
• No unauthorized content promotion or bot message tampering.
• Rule-breaking mods face demotion or ban.

5. PRIVACY & SECURITY
• No sharing private info without permission.
• No impersonation of others.
• No external links in community groups.
• Leaking info results in ban + possible legal action.

6. GROUP & CHAT BEHAVIOR
• No NSFW content.
• No external bots in Raven-Bots groups.
• No kicking bot without permission.
• No hate speech or offensive language.
• No flooding or spamming.

7. GAMBLING & COOLDOWNS
• 20-second cooldown on gambling commands.
• No bypassing cooldowns or gambling with multiple accounts.
• No exploiting gambling system.

───────────────────────────────

8. VIOLATIONS & PENALTIES

• Buying/selling items for real money  
  Level 3 — Permanent ban + asset reset

• Messaging owner without valid reason  
  Level 1 — Warning + 1-day mute

• Harassing/scamming/kicking mods  
  Level 2 — Group restriction + temporary ban

• Scamming users  
  Level 2 — Temporary ban, possible permanent ban

• Using multiple accounts for advantage  
  Level 3 — Ban on main & alt accounts

• Spam tagging owner  
  Level 1 — Warning + 24-hour mute

• Reporting fake bugs  
  Level 2 — Temporary bot command restriction

• Attempting to hack bot  
  Level 4 — Permanent ban + legal action

• Threatening mods/users/owner  
  Level 3 — Permanent ban + group removal

• Spamming bot/mods/community chats  
  Level 1 — Warning + 12-24 hour mute

• Adding other bots to Raven-Bots groups  
  Level 2 — Group restriction + bot removal

• Admin closing groups to claim cards  
  Level 2 — Bot removed from group for 1 month

• Kicking the bot without permission  
  Level 2 — 24-hour ban on bot re-add

• Taking advantage of beginners  
  Level 2 — Temporary or permanent ban

• Abusing admin power  
  Level 2 — Temporary bot removal

• Messaging users without permission  
  Level 2 — Temporary mute or chat restriction

• Sending links in community groups  
  Level 3 — Warning + removal + possible ban

• Sending NSFW content  
  Level 3 — Instant ban + possible legal action

• Abusing gambling cooldown  
  Level 1 — Gambling ban + warnings

• Exploiting double-claimed cards  
  Level 2 — Card removal, no refund

• Mods scamming/harassing users  
  Level 3 — Demotion + ban or reset

• Mods banning each other  
  Level 2 — 7-day mod suspension

• Mods misusing power  
  Level 3 — Demotion + possible ban

• Mods kicking owner  
  Level 4 — Demotion + ban + reset

• Mods claiming cards outside official groups  
  Level 2 — 24-hour mod ban

• Engaging in sexual activity with bot  
  Level 2 — 24-hour ban

───────────────────────────────

Note:  
• Level 1 = Warning / temp mute or small ban  
• Level 2 = Temporary bans/restrictions (1 day – 1 month)  
• Level 3 = Serious bans (up to permanent)  
• Level 4 = Permanent ban + legal actions

╰───────────────────────────────╯
`.trim();

    const gifUrl = 'https://media.tenor.com/PSn71OtIk3YAAAPo/levi-levi-ackerman.mp4';

    await conn.sendMessage(
      msg.key.remoteJid,
      {
        video       : { url: gifUrl },
        gifPlayback : true,
        caption     : rulesText,
      },
      { quoted: msg }
    );
  }
};
