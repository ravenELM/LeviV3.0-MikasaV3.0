// events/onBotAdded.js

module.exports = (sock) => {
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { id: groupId, participants, action } = update;

      if (action !== 'add') return;

      for (const participant of participants) {
        if (participant === sock.user.id) {
          const text = `🙏 Thank you for adding me to this group!\nType *.menu* for more commands.`;

          const gifUrl = 'https://media.tenor.com/muWzFHxzlRoAAAPo/majo-no-tabitabi-the-journey-of-elaina.mp4';

          await sock.sendMessage(groupId, { text });
          await sock.sendMessage(groupId, { video: { url: gifUrl }, gifPlayback: true });
        }
      }
    } catch (e) {
      console.error('Error in onBotAdded event:', e);
    }
  });
};
