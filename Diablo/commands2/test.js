module.exports = {
  name: 'test',
  aliases: [],
  run: async (m, { conn }) => {
    await conn.sendMessage(m.key.remoteJid, {
      text: "🟩𝐋𝚵𝐕𝐈 𝚩𝚯𝚻"
    }, { quoted: m });
  }
};
