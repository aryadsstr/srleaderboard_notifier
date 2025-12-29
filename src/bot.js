require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { getLeaderBoard } = require('./leaderboard');
const { formatTime } = require('./helpers/timeFormat');
const { paginate } = require('./helpers/paginateMessage');
const tokenMap = require('./tokenmap.js');
const { checkLeaderboard } = require('./checker');
const CHANNEL_ID = '1127286900777025606';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
  console.log(`🤖 Bot login sebagai ${client.user.tag}`);

  setInterval(() => {
    checkLeaderboard(client, CHANNEL_ID).catch(console.error);
  }, 60_000);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'lb') {
    const mode = interaction.options.getString('mode');
    const category = tokenMap[mode];

    if (!category) {
      return interaction.reply({
        content: 'Kategori tidak ditemukan',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const allRuns = [];
    let playerList = [];

    for (const token of category.tokens) {
      const data = await getLeaderBoard(token);

      if (!playerList.length) {
        playerList = data.playerList;
      }

      allRuns.push(...data.runList);
    }

    const filteredRuns = allRuns.filter(run => {
      const player = playerList.find(p => p.id === run.playerIds[0]);
      return player?.areaId === 'id';
    });

    if (!filteredRuns.length) {
      return interaction.editReply('Tidak ada runner Indonesia di kategori ini.');
    }

    const runsText = filteredRuns.slice(0, 100).map((run, index) => {
      const player = playerList.find(p => p.id === run.playerIds[0])?.name || 'Unknown';
      const pb = formatTime(run.time);
      const igt = formatTime(run.igt);
      const video = run.video ? `[INI GUYS VIDIONYA](<${run.video}>)` : 'No Video';

      return `**${index + 1}.** ${player}\n⏱ PB: ${pb}\n⏱ IGT: ${igt}\n🎥 ${video}`;
    });

    return paginate(interaction, runsText, `🏆 ${category.label} — Indonesia Leaderboard 🏆`);
  }

  if (interaction.commandName === 'find') {
    const keyword = interaction.options.getString('player').toLowerCase();
    await interaction.deferReply();

    const results = [];

    for (const category of Object.values(tokenMap)) {
        for (const token of category.tokens) {
        const data = await getLeaderBoard(token);

        const indonesianRuns = data.runList.filter(run => {
            const player = data.playerList.find(p => p.id === run.playerIds[0]);
            return player?.areaId === 'id';
        });

        indonesianRuns.sort((a, b) => a.time - b.time);

        indonesianRuns.forEach((run, i) => {
            const player = data.playerList.find(p => p.id === run.playerIds[0]);
            if (!player) return;

            if (player.name.toLowerCase().includes(keyword)) {
            results.push({
                category: category.label,
                rank: i + 1,
                player: player.name,
                run
            });
            }
        });
        }
    }

    if (!results.length) {
        return interaction.editReply(`Runner **${keyword}** tidak ditemukan atau dia bukan berasal dari Indonesia`);
    }

    const resultsText = results.map(r => {
        const video = r.run.video ? `[INI GUYS VIDIONYA](<${r.run.video}>)` : 'No Video';
        return `🎮 **${r.category} INDONESIA**\n🏆 Rank: #${r.rank}\n⏱ PB: ${formatTime(r.run.time)}\n⏱ IGT: ${formatTime(r.run.igt)}\n🎥 ${video}`;
    });

    return paginate(interaction, resultsText, `🔍 Hasil Pencarian: ${keyword}`);
    }
});

client.login(process.env.DISCORD_TOKEN);
