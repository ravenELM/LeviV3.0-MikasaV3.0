// utils/isAuthorized.js
//
// Very simple permission check.
// ✔  Owner ID(s) come from config.ownerIDs
// ✔  Mods are also allowed if you want (optional flag)

const config = require('../config');

/**
 * @param m       the incoming Baileys message object
 * @param sender  full JID of the user who sent the command
 * @param allowMods  (boolean) if true, mods can also pass
 * @returns {boolean}
 */
function checkOwnerAccess(m, sender, allowMods = false) {
  // normalise to JID with @ if not already
  const id = sender.includes('@') ? sender : `${sender}@s.whatsapp.net`;

  if (config.ownerIDs && config.ownerIDs.includes(id)) return true;
  if (allowMods && config.modIDs && config.modIDs.includes(id)) return true;

  // not authorised
  m.reply('⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺');
  return false;
}

module.exports = { checkOwnerAccess };
