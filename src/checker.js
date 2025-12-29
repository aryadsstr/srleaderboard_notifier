const fs = require('fs');
const path = require('path');
const { getLeaderBoard } = require('./leaderboard');
const { formatTime } = require('./helpers/timeFormat');
const tokenMap = require('./tokenmap');

const CACHE_FILE = path.join(__dirname, 'cache', 'last.json');

function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) return {};
  return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
}

function saveCache(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

/**
 * Check leaderboard update dan kirim notifikasi ke channel
 * @param {Client} client Discord.js client
 * @param {string} channelId ID channel untuk kirim notifikasi
 */
async function checkLeaderboard(client, channelId) {
  const oldCache = loadCache();
  const newCache = {};

  for (const [mode, category] of Object.entries(tokenMap)) {
    let allRuns = [];
    let players = [];

    // Ambil semua token per kategori
    for (const token of category.tokens) {
      const data = await getLeaderBoard(token);

      // filter player Indonesia
      const indonesianRuns = data.runList.filter(run => {
        const player = data.playerList.find(p => p.id === run.playerIds[0]);
        return player?.areaId === 'id';
      });

      allRuns.push(...indonesianRuns);

      if (!players.length) {
        players = data.playerList.filter(p => p.areaId === 'id');
      }
    }

    // Simpan top 100
    newCache[mode] = allRuns.slice(0, 100);

    const oldRuns = oldCache[mode] || [];

    for (let i = 0; i < newCache[mode].length; i++) {
      const newRun = newCache[mode][i];
      const oldRun = oldRuns[i];

      // cek PB baru / update
      if (!oldRun || newRun.time < oldRun.time) {
        const player = players.find(p => p.id === newRun.playerIds[0])?.name || 'Unknown';
        const video = newRun.video ? `[INI GUYS VIDIONYA](<${newRun.video}>)` : 'No Video';

        try {
          const channel = await client.channels.fetch(channelId);
          await channel.send({
            content:
              `🚨 **LEADERBOARD UPDATE**\n\n` +
              `🎮 Mode   : **${category.label}**\n` +
              `👤 Runner : **${player}**\n` +
              `🏆 Rank   : #${i + 1}\n` +
              `⏱ PB     : ${formatTime(newRun.time)}\n` +
              `⏱ IGT    : ${formatTime(newRun.igt)}\n` +
              `🎥 ${video}`,
            allowedMentions: { parse: [] }
          });
        } catch (err) {
          console.error('Gagal kirim notifikasi leaderboard:', err);
        }
      }
    }
  }

  saveCache(newCache);
}

module.exports = { checkLeaderboard };
