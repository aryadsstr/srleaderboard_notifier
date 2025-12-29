require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { getLeaderBoard } = require('./leaderboard');
const { checkLeaderboard } = require('./checker');
const { formatTime } = require('./helpers/timeFormat');
const { getIndexWithPart } = require('./helpers/paginationIndex');
const tokenMap = require('./tokenmap.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});


client.once('ready', () => {
  console.log(`Bot Login as ${client.user.tag}`);

  const CHANNEL_ID = process.env.NOTIFY_CHANNEL_ID;

  setInterval(() => {
    checkLeaderboard(client, CHANNEL_ID)
      .catch(err => console.error('Watcher error:', err));
  }, 5 * 60 * 1000);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'lb') {
        const mode = interaction.options.getString('mode');
        const token = tokenMap[mode];

        if (!token) {
            return interaction.reply({
            content: 'Kategori Gaada',
            ephemeral: true
            });
        }

        await interaction.deferReply();

        const data = await getLeaderBoard(token);
        const listRun = data.runList;
        const playerList = data.playerList;

        let message = `🏆 **Speedrun Leaderboard (${mode.toUpperCase()}) Top 10** 🏆\n\n`;

        listRun.slice(0, 50).forEach((run, index) => {
            const playerObj = playerList.find(p => p.id === run.playerIds[0]);
            if (!playerObj) return;

            if (playerObj.areaId !== 'id') return;

            const player = playerObj.name;
            const pb = formatTime(run.time);
            const igt = formatTime(run.igt);
            const video = run.video ? `<${run.video}>` : 'No Video';

            message +=
                `**${index + 1}.** ${player}\n` +
                `⏱ PB : ${pb}\n` +
                `⏱ IGT: ${igt}\n` +
                `🎥 [INI GUYS VIDIONYA](${video})\n\n`;
        });

        return interaction.editReply({
            content: message,
            allowedMentions: { parse: [] }
        });
    }

    if (interaction.commandName === 'find') {
        const keyword = interaction.options.getString('player').toLowerCase();

        await interaction.deferReply();

        const results = [];

        for (const [mode, token] of Object.entries(tokenMap)) {
            const data = await getLeaderBoard(token);
            const category = mode.replace(/P[23]/i, '');

            const runList = data.runList;
            const playerList = data.playerList;

            for (let i = 0; i < runList.length; i++) {
                const run = runList[i];
                const player =
                    playerList.find(p => p.id === run.playerIds[0])?.name || 'Unknown';

                if (player.toLowerCase().includes(keyword)) {
                    results.push({
                        category,
                        rank: getIndexWithPart(mode, i + 1),
                        player,
                        run
                    });
                }
            }
        }

        if (results.length === 0) {
            return interaction.editReply(
            `Runner **${keyword}** tidak ditemukan di kategori manapun`
            );
        }

        let message = `🔍 **Hasil Pencarian Runner: ${keyword}**\n\n`;

        results.forEach(res => {
            const pb = formatTime(res.run.time);
            const igt = formatTime(res.run.igt);
            const video = res.run.video ? `<${res.run.video}>` : 'No Video';

            message +=
            `🎮 **${res.category.toUpperCase()}**\n` +
            `🏆 Rank: **#${res.rank}**\n` +
            `⏱ PB : ${pb}\n` +
            `⏱ IGT: ${igt}\n` +
            `🎥 [INI GUYS VIDIONYA](${video})\n\n`;
        });

        return interaction.editReply({
            content: message,
            allowedMentions: { parse: [] }
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
