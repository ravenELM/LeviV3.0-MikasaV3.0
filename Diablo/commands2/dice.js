module.exports = {
  name: 'dice',
  aliases: ['roll'],
  description: 'Aruncă un zar (⬛⬜)',

  /**
   * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   * @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[] }} ctx
   */
  async run(msg, { conn }) {
    const chat = msg.key.remoteJid;
    const dot = '⬛';
    const empty = '⬜';

    const faces = {
      1: [
        [empty, empty, empty],
        [empty, dot,   empty],
        [empty, empty, empty]
      ],
      2: [
        [dot,   empty, empty],
        [empty, empty, empty],
        [empty, empty, dot  ]
      ],
      3: [
        [dot,   empty, empty],
        [empty, dot,   empty],
        [empty, empty, dot  ]
      ],
      4: [
        [dot,   empty, dot  ],
        [empty, empty, empty],
        [dot,   empty, dot  ]
      ],
      5: [
        [dot,   empty, dot  ],
        [empty, dot,   empty],
        [dot,   empty, dot  ]
      ],
      6: [
        [dot,   empty, dot  ],
        [dot,   empty, dot  ],
        [dot,   empty, dot  ]
      ]
    };

    const roll = Math.floor(Math.random() * 6) + 1;
    const grid = faces[roll].map(row => row.join('')).join('\n');

    await conn.sendMessage(chat, {
      text: `🎲 Dice: *${roll}*\n${grid}`
    }, { quoted: msg });
  }
};
