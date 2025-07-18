module.exports = {
  name : 'myid',
  async run (msg, { conn }) {
    const gid = msg.key.remoteJid;
    const meta = await conn.groupMetadata(gid);

    const you   = conn.user.id;
    const found = meta.participants.find(p => p.id === you);

    const txt = found
      ? `✅ Bot record:\n${JSON.stringify(found, null, 2)}`
      : '❌ Bot record NOT found in participants list!';

    await conn.sendMessage(gid, { text: txt }, { quoted: msg });
  }
};
