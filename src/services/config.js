const path = require('path');
const fs   = require('fs');

const CONFIG_PATH = path.join(__dirname, '../../data/servers.json');

function readConfig() {
    if (!fs.existsSync(CONFIG_PATH)) return {};
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8').trim();
    if (!raw) return {};
    return JSON.parse(raw);
}

function saveConfig(data) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readConfig, saveConfig };