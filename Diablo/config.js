const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
dotenv.config();

/**
 * Helper: append “@s.whatsapp.net” if the value looks like a plain number.
 * Accepts   "40784364650" ➜ "40784364650@s.whatsapp.net"
 * Leaves    "40784364650@s.whatsapp.net" as‑is.
 */
const toJid = v => /\d+$/.test(v) ? `${v}@s.whatsapp.net` : v.trim();

// Load economy groups from JSON file
const economyGroups = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'economy-groups.json')));
  } catch {
    return [];
  }
})();

module.exports = {
  // ...other config...

  /* === IDs === */
  ownerNumber : process.env.OWNER_NUMBER || '40736676892',
  ownerIDs    : (process.env.OWNER_IDS  || '40736676892@s.whatsapp.net')
                  .split(',')
                  .filter(Boolean)
                  .map(toJid),

  mods        : (process.env.MODS || '40736676892')
                  .split(',')
                  .filter(Boolean)
                  .map(toJid),

  /* === Economy Groups === */
  economyGroups,

  /* === Bot identity === */
  botName : process.env.BOT_NAME || '𝔐𝔦𝔨𝔞𝔰𝔞',
  prefix  : process.env.PREFIX   || '.',

  /* === Groups & links === */
  casinoGroupId  : '120363399196726068@g.us',
  casinoGroupLink: process.env.CASINO_GC_LINK
                    || 'https://chat.whatsapp.com/FtGlFeNKIV0CyLPxlfjnmV',

  /* === Optional placeholders === */
  phoneNumber : process.env.PHONE_NUMBER || '',

  /* === Messages === */
  messages : {
    welcome: process.env.WELCOME_MSG || 'Welcome @user!',
    leave  : process.env.LEAVE_MSG   || 'Bye @user!',
    ban    : process.env.BAN_MSG     || '@user has been banned.',
    unban  : process.env.UNBAN_MSG   || '@user has been unbanned.',
  },

  /* === Economy rewards === */
  rewards : {
    daily   : parseInt(process.env.DAILY_REWARD   || '10000', 10), // <-- 10,000 coins
    payday  : parseInt(process.env.PAYDAY_REWARD  || '5000',  10),
    jackpot : parseInt(process.env.JACKPOT_REWARD || '200000', 10),
  },
};