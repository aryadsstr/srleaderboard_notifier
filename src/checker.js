const fs = require('fs');
const path = require('path');
const { getLeaderBoard } = require('./leaderboard');
const { formatTime } = require('./helpers/timeFormat');
const { getIndexWithPart } = require('./helpers/paginationIndex');
const tokenMap = require('./tokenmap');

const CACHE_FILE = path.join(__dirname, 'cache', 'last.json');

function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) return {};
  return JSON.parse(fs.readFileSync(CACHE_FILE));
}

function saveCache(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

async function checkLeaderboard(client, channelId) {
  const oldCache = loadCache();
  const newCache = {};

  for (const [mode, token] of Object.entries(tokenMap)) {
    const data = await getLeaderBoard(token);
    const runs = data.runList;
    const players = data.playerList;

    newCache[mode] = runs.slice(0, 10);

    const oldRuns = oldCache[mode] || [];

    for (let i = 0; i < newCache[mode].length; i++) {
      const newRun = newCache[mode][i];
      const oldRun = oldRuns[i];

      if (!oldRun || newRun.time < oldRun.time) {
        const player =
          players.find(p => p.id === newRun.playerIds[0])?.name || 'Unknown';

        const channel = await client.channels.fetch(channelId);

        channel.send({
          content:
            `🚨 **LEADERBOARD UPDATE**\n\n` +
            `🎮 Mode   : ${mode.toUpperCase()}\n` +
            `👤 Runner : **${player}**\n` +
            `🏆 Rank   : #${ getIndexWithPart(mode, i + 1)}\n` +
            `⏱ PB     : ${formatTime(newRun.time)}\n` +
            `⏱ IGT    : ${formatTime(newRun.igt)}\n` +
            `🎥 [INI GUYS VIDIONYA](${newRun.video ? `<${newRun.video}>` : 'No Video'})`,
          allowedMentions: { parse: [] }
        });
      }
    }
  }

  saveCache(newCache);
}

module.exports = { checkLeaderboard };