require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

const bots = [
    { name: 'Main Bot',  file: path.join(__dirname, 'src/bot.js') },
    { name: 'Dashboard', file: path.join(__dirname, 'dashboard/server.js') },
];
function launch(bot) {
    console.log(`[LAUNCHER] Starting ${bot.name}...`);
    const proc = spawn('node', [bot.file], { stdio: 'inherit' });

    proc.on('close', (code) => {
        console.log(`[LAUNCHER] ${bot.name} exited with code ${code}. Restarting in 3s...`);
        setTimeout(() => launch(bot), 3000);
    });

    proc.on('error', (err) => {
        console.error(`[LAUNCHER] Failed to start ${bot.name}:`, err);
        setTimeout(() => launch(bot), 3000);
    });
}

bots.forEach(launch);
