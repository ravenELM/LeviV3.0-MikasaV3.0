module.exports = {
  name: 'kill',
  desc: 'Kill a player by Player ID (max 2 kills per day)',
  groupOnly: false, // DM only recommended

  async run(msg, { conn }) {
    const killer = msg.key.remoteJid;
    const args = msg.message?.conversation?.split(' ');
    const targetPlayerID = args[1];

    if (!targetPlayerID) {
      await conn.sendMessage(killer, { text: '❌ Please provide a Player ID to kill.' }, { quoted: msg });
      return;
    }

    if (global.eliminatedPlayers?.has(killer)) {
      await conn.sendMessage(killer, { text: '❌ You are eliminated and cannot kill.' }, { quoted: msg });
      return;
    }

    const playerData = global.playersRoles?.get(killer);
    if (!playerData || playerData.role !== 'Killer') {
      await conn.sendMessage(killer, { text: '❌ Only Killers can kill.' }, { quoted: msg });
      return;
    }

    const killsDone = global.killsDoneByPlayer?.get(killer) || 0;
    if (killsDone >= 2) {
      await conn.sendMessage(killer, { text: '❌ You have already used your 2 kills for today.' }, { quoted: msg });
      return;
    }

    // Find player by playerID
    const targetEntry = Array.from(global.playersRoles.entries())
      .find(([, data]) => data.playerID === targetPlayerID);

    if (!targetEntry) {
      await conn.sendMessage(killer, { text: '❌ Invalid Player ID.' }, { quoted: msg });
      return;
    }

    const [targetPlayer] = targetEntry;

    if (global.eliminatedPlayers?.has(targetPlayer)) {
      await conn.sendMessage(killer, { text: '❌ Target player is already eliminated.' }, { quoted: msg });
      return;
    }

    if (targetPlayer === killer) {
      await conn.sendMessage(killer, { text: '❌ You cannot kill yourself.' }, { quoted: msg });
      return;
    }

    // Kill player (eliminate)
    global.eliminatedPlayers.add(targetPlayer);
    global.registeredPlayers.delete(targetPlayer);
    global.playersRoles.delete(targetPlayer);
    global.killsDoneByPlayer.set(killer, killsDone + 1);

    await conn.sendMessage(killer, { text: `💀 You have killed Player ID: ${targetPlayerID}. Kills today: ${killsDone + 1}/2` }, { quoted: msg });
    await conn.sendMessage(targetPlayer, { text: `⚠️ You have been killed by a Killer.` });
  }
};
