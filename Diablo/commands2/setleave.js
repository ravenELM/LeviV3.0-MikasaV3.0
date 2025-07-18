const fs = require('fs');
const path = require('path');
const { ownerIDs, mods } = require('../config');

const dataDir = path.join(__dirname, '../data');
const filePath = path.join(dataDir, 'leaveMessages.json');

const load = () => { try { return JSON.parse(fs.readFileSync(filePath)); } catch { return {}; } };
const save = (obj) => { fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(filePath, JSON.stringify(obj, null, 2)); };

const leaves = load();
const jidNorm = (jid = '') => jid.split(':')[0];

module.exports = {
  name: 'setleave',
  aliases: ['leavemsg'],
  groupOnly: true,
  desc: 'Set or change the leave message for this group',

  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const senderId = jidNorm(msg.key.participant || chatId);

    const meta = await conn.groupMetadata(chatId);
    const admins = meta.participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => jidNorm(p.id));

    const allowed = admins.includes(senderId) ||
      ownerIDs.map(jidNorm).includes(senderId) ||
      mods.map(jidNorm).includes(senderId);

    if (!allowed) {
      return conn.sendMessage(chatId, {
        text: '❌ Only group admins / owner / mods can set the leave message.',
      }, { quoted: msg });
    }

    if (args.length === 0) {
      return conn.sendMessage(chatId, {
        text: '⚠️ Usage:\n.setleave Thanks for the memories we didn’t make. Bye now @username!',
      }, { quoted: msg });
    }

    const template = args.join(' ');
    leaves[chatId] = template;
    save(leaves);

    return conn.sendMessage(chatId, {
      text: `✅ Leave message updated:\n\n${template}`,
    }, { quoted: msg });
  },

  setup(sock) {
    sock.ev.on('group-participants.update', async (ev) => {
      if (ev.action !== 'remove') return;

      const template = leaves[ev.id];
      if (!template) return;

      const meta = await sock.groupMetadata(ev.id);
      const groupName = meta.subject;
      const memberCount = meta.participants.length;

      for (const left of ev.participants) {
        const userJid = jidNorm(left);
        const username = `@${userJid.split('@')[0]}`;

        let removedByText = 'Left the group';
        if (ev.actor && jidNorm(ev.actor) !== userJid) {
          removedByText = `Removed by @${jidNorm(ev.actor).split('@')[0]}`;
        }

        const leaveText = template
          .replace(/@username/gi, username)
          .replace(/@group/gi, groupName)
          .replace(/@count/gi, memberCount)
          .replace(/@removedby/gi, removedByText);

        // Get profile picture
        let profilePic;
        try {
          profilePic = await sock.profilePictureUrl(left, 'image');
        } catch {
          profilePic = 'https://i.ibb.co/7WZRn4f/default.jpg'; // fallback image
        }

        await sock.sendMessage(ev.id, {
          text: leaveText,
          contextInfo: {
            mentionedJid: [left, ev.actor].filter(Boolean),
            externalAdReply: {
              title: "𝐋𝚵𝐕𝐈 𝚩𝚯𝚻!",
              body: groupName,
              thumbnailUrl: profilePic,
              mediaType: 1,
              renderLargerThumbnail: true,
              showAdAttribution: false,
              sourceUrl: ''
            }
          }
        });
      }
    });
  }
};
