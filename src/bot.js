require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { getLeaderBoard } = require('./leaderboard');
const { formatTime } = require('./helpers/timeFormat');
const tokenMap = require('./tokenmap.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
  console.log(`Bot login sebagai ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'lb') {
    const mode = interaction.options.getString('mode');
    const category = tokenMap[mode];

    if (!category) {
      return interaction.reply({ content: 'Kategori ga ada', ephemeral: true });
    }

    await interaction.deferReply();

    const allRuns = [];
    let playerList = [];

    for (const token of category.tokens) {
      const data = await getLeaderBoard(token);
      if (!playerList.length) playerList = data.playerList;
      allRuns.push(...data.runList);
    }

    const filteredRuns = allRuns.filter(run => {
      const player = playerList.find(p => p.id === run.playerIds[0]);
      return player?.areaId === 'id';
    });

    let message =
      `🏆 **${category.label} — Indonesia Leaderboard** 🏆\n\n`;

    filteredRuns.slice(0, 10).forEach((run, index) => {
      const player = playerList.find(p => p.id === run.playerIds[0])?.name || 'Unknown';
      const pb = formatTime(run.time);
      const igt = formatTime(run.igt);
      const video = run.video ? `<${run.video}>` : 'No Video';

      message +=
        `**${index + 1}.** ${player}\n` +
        `⏱ PB : ${pb}\n` +
        `⏱ IGT: ${igt}\n` +
        `🎥 ${video}\n\n`;
    });

    return interaction.editReply({ content: message });
  }

  if (interaction.commandName === 'find') {
    const keyword = interaction.options.getString('player').toLowerCase();
    await interaction.deferReply();

    const results = [];

    for (const category of Object.values(tokenMap)) {
      for (const token of category.tokens) {
        const data = await getLeaderBoard(token);

        for (let i = 0; i < data.runList.length; i++) {
          const run = data.runList[i];
          const player = data.playerList.find(p => p.id === run.playerIds[0]);
          if (!player) continue;

          if (
            player.areaId === 'id' &&
            player.name.toLowerCase().includes(keyword)
          ) {
            results.push({
              category: category.label,
              rank: i + 1,
              player: player.name,
              run
            });
          }
        }
      }
    }

    if (!results.length) {
      return interaction.editReply(`Runner **${keyword}** tidak ditemukan`);
    }

    let message = `🔍 **Hasil Pencarian: ${keyword}**\n\n`;

    results.forEach(r => {
      message +=
        `🎮 **${r.category}**\n` +
        `🏆 Rank: #${r.rank}\n` +
        `⏱ PB: ${formatTime(r.run.time)}\n` +
        `🎥 ${r.run.video ? `<${r.run.video}>` : 'No Video'}\n\n`;
    });

    return interaction.editReply({ content: message });
  }
});

client.login(process.env.DISCORD_TOKEN);
