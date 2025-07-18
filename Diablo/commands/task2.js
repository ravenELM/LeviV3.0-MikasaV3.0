module.exports = {
  name: 'task',
  desc: 'Complete a mechanic task (max 5 per day)',
  groupOnly: false, // works in DM too

  async run(msg, { conn }) {
    const player = msg.key.remoteJid;
    const args = msg.message?.conversation?.split(' ').slice(1).join(' ') || 'a task';

    if (global.eliminatedPlayers?.has(player)) {
      await conn.sendMessage(player, { text: '❌ You are eliminated and cannot do tasks.' }, { quoted: msg });
      return;
    }

    const playerRole = global.playersRoles?.get(player)?.role;
    if (playerRole !== 'Mechanic') {
      await conn.sendMessage(player, { text: '❌ Only Mechanics can do tasks.' }, { quoted: msg });
      return;
    }

    const doneTasks = global.mechanicTasksDoneByPlayer?.get(player) || 0;
    if (doneTasks >= 5) {
      await conn.sendMessage(player, { text: '✅ You have completed your 5 tasks today.' }, { quoted: msg });
      return;
    }

    global.mechanicTasksDoneByPlayer.set(player, doneTasks + 1);
    global.dailyMechanicTasksRemaining--;

    await conn.sendMessage(player, {
      text: `🛠️ Task done: ${args}\nYour progress today: ${doneTasks + 1}/5\nGlobal remaining tasks: ${global.dailyMechanicTasksRemaining}/${global.globalMechanicTasksTotal}`
    }, { quoted: msg });
  }
};
