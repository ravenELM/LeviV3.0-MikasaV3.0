const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'def',
  aliases: [],
  description: 'Show info about a command by name or alias',

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;

    // Get user input args (command name or alias)
    const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
    const args = text.split(/\s+/).slice(1);

    if (args.length === 0) {
      return conn.sendMessage(chatId, { text: '❗ Please provide a command name or alias.\nExample: .def getc' }, { quoted: msg });
    }

    const query = args[0].toLowerCase();

    // Path to commands2 folder
    const commandsDir = path.join(__dirname, '..', 'commands2');

    let commands = [];
    try {
      const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
      for (const file of files) {
        try {
          const cmd = require(path.join(commandsDir, file));
          // Only add if cmd has a valid name string
          if (cmd && typeof cmd.name === 'string') {
            commands.push(cmd);
          }
        } catch (e) {
          console.warn(`Failed to load command file: ${file}`, e);
        }
      }
    } catch (err) {
      return conn.sendMessage(chatId, { text: `❌ Error loading commands.` }, { quoted: msg });
    }

    // Find command by name or alias safely
    const command = commands.find(cmd => {
      if (!cmd.name) return false;
      if (cmd.name.toLowerCase() === query) return true;
      if (cmd.aliases && Array.isArray(cmd.aliases)) {
        return cmd.aliases.some(a => a && a.toLowerCase() === query);
      }
      return false;
    });

    if (!command) {
      return conn.sendMessage(chatId, { text: `❌ Command *${query}* not found.` }, { quoted: msg });
    }

    // Format aliases or show None
    const aliasesText = (command.aliases && command.aliases.length > 0)
      ? command.aliases.join(', ')
      : 'None';

    const infoText = `🍁 *Command:* ${command.name}\n🧩 *Alias:* ${aliasesText}\n🧩 *Description:* ${command.description || 'No description provided.'}`;

    await conn.sendMessage(chatId, { text: infoText }, { quoted: msg });
  }
};
