async function setRandomBio(conn) {
  const bios = [
    "I'm usually shy, but you're worth taking a chance for. 🎐 Elaina-Bot",
    "Sometimes quiet, always listening. 🎐 Elaina-Bot",
    "Finding beauty in the little things. 🎐 Elaina-Bot",
    "Gentle whispers in the digital breeze. 🎐 Elaina-Bot",
    "Slow and steady wins the race. 🎐 Elaina-Bot",
    "Courage blooms in silent moments. 🎐 Elaina-Bot",
    "Softly sparkling in your chats. 🎐 Elaina-Bot",
    "Dreaming big behind this bot. 🎐 Elaina-Bot",
    "Here to brighten your day quietly. 🎐 Elaina-Bot",
    "Silent strength in every word. 🎐 Elaina-Bot",
    "Grace in simplicity. 🎐 Elaina-Bot",
    "Peace flows through these messages. 🎐 Elaina-Bot",
    "Your gentle companion online. 🎐 Elaina-Bot",
    "Quietly making magic happen. 🎐 Elaina-Bot",
    "Every message wrapped in calm. 🎐 Elaina-Bot",
  ];

  const randomBio = bios[Math.floor(Math.random() * bios.length)];
  try {
    await conn.query({
      tag: 'setStatus',
      attrs: { status: randomBio }
    });
    console.log('📝 Status/bio updated:', randomBio);
  } catch (e) {
    console.error('Failed to update bio:', e);
  }
}
