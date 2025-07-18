const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = {
  name: "generate",
  aliases: ['generateimage', 'imggen', 'imagegen'],
  desc: "Generate an image from a text prompt using OpenAI",
  groupOnly: false,

  async run(msg, { conn, args }) {
    if (!args.length) {
      return conn.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Please provide a prompt for the image generation." },
        { quoted: msg }
      );
    }

    const prompt = args.join(" ");

    try {
      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
      });

      const image_base64 = result.data[0].b64_json;
      const image_bytes = Buffer.from(image_base64, "base64");

      // Save the image temporarily
      const imagePath = path.join(__dirname, "..", "temp", `gimg_${Date.now()}.png`);
      fs.writeFileSync(imagePath, image_bytes);

      // Send the image as a message
      await conn.sendMessage(
        msg.key.remoteJid,
        { image: fs.readFileSync(imagePath), caption: `Image generated for:\n${prompt}` },
        { quoted: msg }
      );

      // Delete the temp image after sending
      fs.unlinkSync(imagePath);
    } catch (error) {
      console.error(error);
      await conn.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Failed to generate image, please try again later." },
        { quoted: msg }
      );
    }
  },
};
