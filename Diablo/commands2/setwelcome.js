const fs = require('fs');
const path = require('path');
const { ownerIDs, mods } = require('../config');

const dataDir = path.join(__dirname, '../data');
const filePath = path.join(dataDir, 'welcomeMessages.json');

const load = () => { try { return JSON.parse(fs.readFileSync(filePath)); } catch { return {}; } };
const save = (obj) => { fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(filePath, JSON.stringify(obj, null, 2)); };

const welcomes = load();
const jidNorm = (jid = '') => jid.split(':')[0];

module.exports = {
  name: 'setwelcome',
  aliases: ['welcomemsg'],
  groupOnly: true,
  desc: 'Set or change the welcome message for this group',

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
        text: '❌ Only group admins / owner / mods can set the welcome message.',
      }, { quoted: msg });
    }

    if (args.length === 0) {
      return conn.sendMessage(chatId, {
        text: '⚠️ Usage:\n.setwelcome A wild @username appeared!\nWelcome to @group!\nMember #: @count\n@addedby',
      }, { quoted: msg });
    }

    const template = args.join(' ');
    welcomes[chatId] = template;
    save(welcomes);

    return conn.sendMessage(chatId, {
      text: `✅ Welcome message updated:\n\n${template}`,
    }, { quoted: msg });
  },

  setup(sock) {
    sock.ev.on('group-participants.update', async (ev) => {
      if (ev.action !== 'add') return;

      const template = welcomes[ev.id];
      if (!template) return;

      const meta = await sock.groupMetadata(ev.id);
      const groupName = meta.subject;
      const memberCount = meta.participants.length;

      for (const joined of ev.participants) {
        const userJid = jidNorm(joined);
        const username = `@${userJid.split('@')[0]}`;

        let addedByText = 'Joined via group link';
        if (ev.actor && jidNorm(ev.actor) !== userJid) {
          addedByText = `Added by @${jidNorm(ev.actor).split('@')[0]}`;
        }

        const welcomeText = template
          .replace(/@username/gi, username)
          .replace(/@group/gi, groupName)
          .replace(/@count/gi, memberCount)
          .replace(/@addedby/gi, addedByText);

        // Get profile picture (fallback if error)
        let profilePic;
        try {
          profilePic = await sock.profilePictureUrl(joined, 'image');
        } catch {
          profilePic = 'https://i.ibb.co/7WZRn4f/default.jpg'; // fallback
        }

        await sock.sendMessage(ev.id, {
          text: welcomeText,
          contextInfo: {
            mentionedJid: [joined, ev.actor].filter(Boolean),
            externalAdReply: {
              title: "𝐋𝚵𝐕𝐈 𝚩𝚯𝚻",
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
