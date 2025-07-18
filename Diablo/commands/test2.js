module.exports = {
  name: 'test',
  aliases: [],
  run: async (m, { conn }) => {
    await conn.sendMessage(m.key.remoteJid, {
      text: "🟩𝚳𝚰𝚱𝚨𝐒𝚨 𝚩𝚯𝚻ks"
    }, { quoted: m });
  }
};
