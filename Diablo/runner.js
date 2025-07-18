const { spawn } = require('child_process');

function startBot() {
  const botProcess = spawn('node', ['index.cjs'], { stdio: 'inherit' });

  botProcess.on('exit', (code, signal) => {
    console.log(`Bot stopped with code ${code} and signal ${signal}. Restarting in 3 seconds...`);
    setTimeout(startBot, 3000);
  });

  botProcess.on('error', (err) => {
    console.error('Failed to start bot process:', err);
  });
}

startBot();
