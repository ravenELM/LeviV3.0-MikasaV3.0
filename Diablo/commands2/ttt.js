// commands/ttt.js

const BOARD_POSITIONS = {
  1: [0, 0],
  2: [0, 1],
  3: [0, 2],
  4: [1, 0],
  5: [1, 1],
  6: [1, 2],
  7: [2, 0],
  8: [2, 1],
  9: [2, 2],
};

const EMPTY_CELL = '⬜';
const PLAYER_X = '❌';
const PLAYER_O = '⭕';

const games = new Map(); // chatId => game state

function renderBoard(board) {
  return board.map(row => row.join('')).join('\n');
}

function checkWin(board, player) {
  for (let i = 0; i < 3; i++) {
    if (
      board[i][0] === player &&
      board[i][1] === player &&
      board[i][2] === player
    ) return true;
    if (
      board[0][i] === player &&
      board[1][i] === player &&
      board[2][i] === player
    ) return true;
  }
  if (
    board[0][0] === player &&
    board[1][1] === player &&
    board[2][2] === player
  ) return true;
  if (
    board[0][2] === player &&
    board[1][1] === player &&
    board[2][0] === player
  ) return true;

  return false;
}

function checkDraw(board) {
  return board.every(row => row.every(cell => cell !== EMPTY_CELL));
}

async function sendBoard(conn, jid, board, turnUserId, msg = null) {
  const boardStr = renderBoard(board);
  const turnSymbol = turnUserId ? (turnUserId === 'X' ? PLAYER_X : PLAYER_O) : '';
  const text = `🎲 Tic-Tac-Toe\n\n${boardStr}\n\nTurn: ${turnSymbol}`;
  await conn.sendMessage(jid, { text }, { quoted: msg });
}

async function startNewGame(conn, jid, starterId, msg) {
  const board = [
    [EMPTY_CELL, EMPTY_CELL, EMPTY_CELL],
    [EMPTY_CELL, EMPTY_CELL, EMPTY_CELL],
    [EMPTY_CELL, EMPTY_CELL, EMPTY_CELL],
  ];

  const game = {
    board,
    players: {
      X: starterId,
      O: null,
    },
    turn: 'X',
    status: 'playing',
  };

  games.set(jid, game);

  await conn.sendMessage(jid, {
    text: `New Tic-Tac-Toe game started!\n\nPlayer ❌ is <@${starterId.split('@')[0]}>\nPlayer ⭕ is waiting to join.\n\nMake a move by sending *.1* to *.9* corresponding to positions:\n1 2 3\n4 5 6\n7 8 9\n\nPlayer ❌ goes first.`,
    mentions: [starterId]
  }, { quoted: msg });

  await sendBoard(conn, jid, board, game.turn, msg);
}

async function makeMove({ conn, msg, move, sender }) {
  const jid = msg.key.remoteJid;
  if (!jid.endsWith('@g.us')) return false;

  const game = games.get(jid);
  if (!game || game.status !== 'playing') return false;

  if (game.players.X !== sender && game.players.O !== sender) {
    if (!game.players.O) {
      game.players.O = sender;
      await conn.sendMessage(jid, { text: `<@${sender.split('@')[0]}> joined as ⭕!` }, { quoted: msg, mentions: [sender] });
    } else {
      await conn.sendMessage(jid, { text: `You're not a player in this game.` }, { quoted: msg });
      return true;
    }
  }

  if (game.players[game.turn] !== sender) {
    await conn.sendMessage(jid, { text: `It's not your turn.` }, { quoted: msg });
    return true;
  }

  if (!(move >= 1 && move <= 9)) {
    await conn.sendMessage(jid, { text: `Invalid move. Send a number from 1 to 9.` }, { quoted: msg });
    return true;
  }

  const [r, c] = BOARD_POSITIONS[move];
  if (game.board[r][c] !== EMPTY_CELL) {
    await conn.sendMessage(jid, { text: `That position is already taken.` }, { quoted: msg });
    return true;
  }

  game.board[r][c] = game.turn;

  if (checkWin(game.board, game.turn)) {
    game.status = 'ended';
    await sendBoard(conn, jid, game.board, null, msg);
    await conn.sendMessage(jid, {
      text: `🎉 Player ${game.turn === 'X' ? PLAYER_X : PLAYER_O} (<@${sender.split('@')[0]}>) wins!`
    }, { quoted: msg, mentions: [sender] });
    games.delete(jid);
    return true;
  }

  if (checkDraw(game.board)) {
    game.status = 'ended';
    await sendBoard(conn, jid, game.board, null, msg);
    await conn.sendMessage(jid, { text: `It's a draw! No more moves left.` }, { quoted: msg });
    games.delete(jid);
    return true;
  }

  game.turn = game.turn === 'X' ? 'O' : 'X';

  await sendBoard(conn, jid, game.board, game.turn, msg);

  return true;
}

async function run(msg, { conn, args }) {
  const jid = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;

  const game = games.get(jid);

  if (!game) {
    await startNewGame(conn, jid, sender, msg);
    return;
  }

  if (game.status === 'playing') {
    await sendBoard(conn, jid, game.board, game.turn, msg);
    await conn.sendMessage(jid, {
      text: `Game already in progress.\nPlayer ❌: <@${game.players.X?.split('@')[0] || 'N/A'}>\nPlayer ⭕: <@${game.players.O?.split('@')[0] || 'Waiting...'}>\nTurn: ${game.turn === 'X' ? PLAYER_X : PLAYER_O}`
    }, { quoted: msg, mentions: [game.players.X, game.players.O].filter(Boolean) });
  } else {
    await conn.sendMessage(jid, { text: `No active game. Start a new one with *.ttt*` }, { quoted: msg });
  }
}

module.exports = {
  name: 'ttt',
  aliases: ['tictactoe'],
  run,
  makeMove
};
