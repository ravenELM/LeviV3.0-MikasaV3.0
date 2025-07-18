// commands/group-kick.js
// ─────────────────────────────────────────────────────────────
// Kick mentioned / replied user(s).  Caller must be: group‑admin,
//                              OR   bot‑owner                 OR   bot‑mod.
// The bot itself obviously needs admin *in WhatsApp*, but we now
// detect that reliably across all device IDs & group types.

const { ownerIDs, mods } = require('../config');

/* helpers */
const stripDevice = jid => (jid || '').split(':')[0];        // remove :device suffix
const norm        = jid => stripDevice(jid).replace(/[^0-9]/g, '');

async function fetchMeta (conn, gid) {
  try   { return await conn.groupMetadata(gid); }
  catch (e) {
    console.error('kick ‑ groupMetadata error →', e);
    return null;
  }
}

module.exports = {
  name      : 'kick',
  aliases   : ['remove'],
  desc      : 'Kick tagged / replied user(s)',
  groupOnly : true,

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg */
  async run (msg, { conn }) {

    const gId      = msg.key.remoteJid;                    // …@g.us
    const callerId = norm(msg.key.participant || msg.key.remoteJid);

    /* 1️⃣  Get metadata & admin list */
    const meta = await fetchMeta(conn, gId);
    if (!meta)
      return conn.sendMessage(gId,
        { text: '❌ Could not read group info (WhatsApp lag?). Retry in a moment.' },
        { quoted: msg });

    const adminJids = meta.participants
      .filter(p => p.admin)                                // 'admin' or 'superadmin'
      .map(p => norm(p.id));

    /* 2️⃣  Permission check for the *caller* */
    const callerOK =
         adminJids.includes(callerId)
      || ownerIDs.map(norm).includes(callerId)
      || mods.map(norm).includes(callerId);

    if (!callerOK)
      return conn.sendMessage(gId,
        { text: '❌ Only group admins / mods / owner may use *.kick*, Baka!' },
        { quoted: msg });

    /* 3️⃣  Does the BOT have admin?  (robust) */
    const botId     = norm(conn.user.id);
    const botRecord = meta.participants.find(p => norm(p.id) === botId);
    const botIsAd   = botRecord?.admin;                    // truthy ⇒ 'admin'/'superadmin'

   if (!botIsAd) {
  return conn.sendMessage(gId,
    { text: '⚠️ I need *admin* rights to kick members, Baka!' },
    { quoted: msg });
}



    /* 4️⃣  Build target list (mentions / reply / raw number) */
    const ctx       = msg.message?.extendedTextMessage?.contextInfo || {};
    const mention   = ctx.mentionedJid ?? [];
    const replied   = ctx.participant ? [ctx.participant] : [];
    const typedNum  = /^\d{5,16}$/.test(msg.message?.conversation || '')
                    ? [`${msg.message.conversation}@s.whatsapp.net`] : [];

    const targets = [...new Set([...mention, ...replied, ...typedNum].map(norm))];

    if (targets.length === 0)
      return conn.sendMessage(gId,
        { text: '⚠️ Tag / reply / type a number to kick.\nEx: *.kick @user*' },
        { quoted: msg });

    /* 5️⃣  Kick loop */
    for (const raw of targets) {
      const jidFull   = `${raw}@s.whatsapp.net`;
      const protected =
           ownerIDs.map(norm).includes(raw)
        || mods.map(norm).includes(raw)
        || adminJids.includes(raw)
        || raw === botId;

      if (protected) {
        await conn.sendMessage(gId,
          { text: `🚫 Cannot kick @${raw} (protected).`, mentions: [jidFull] },
          { quoted: msg });
        continue;
      }

      try {
        await conn.groupParticipantsUpdate(gId, [jidFull], 'remove');
        await conn.sendMessage(gId,
          { text: `✅ @${raw} has been kicked.`, mentions: [jidFull] },
          { quoted: msg });
      } catch (err) {
        console.error('kick ‑ remove error →', err);
        await conn.sendMessage(gId,
          { text: `❌ Failed to kick @${raw}.`, mentions: [jidFull] },
          { quoted: msg });
      }
    }
  }
};
