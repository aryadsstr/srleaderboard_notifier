const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const ITEMS_PER_PAGE = 10;

function chunkArray(array, size = ITEMS_PER_PAGE) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function paginate(interaction, itemsArray, headerText = '', timeout = 60_000) {
  const pages = chunkArray(itemsArray, ITEMS_PER_PAGE);
  let page = 0;

  const getRow = (disabled = false) =>
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('⏮')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('⏭')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled)
    );

  const formatPage = (pageIndex) =>
    `📄 **Page ${pageIndex + 1}/${pages.length}**\n\n${headerText ? headerText + '\n\n' : ''}${pages[pageIndex].join('\n\n')}`;

  const message = await interaction.editReply({
    content: formatPage(page),
    components: [getRow()],
    allowedMentions: { parse: [] }
  });

  const collector = message.createMessageComponentCollector({
    time: timeout,
    filter: i => i.user.id === interaction.user.id
  });

  collector.on('collect', async i => {
    if (i.customId === 'prev') page--;
    if (i.customId === 'next') page++;

    if (page < 0) page = pages.length - 1;
    if (page >= pages.length) page = 0;

    await i.update({
      content: formatPage(page),
      components: [getRow()],
      allowedMentions: { parse: [] }
    }).catch(() => {});
  });

  collector.on('end', async () => {
    await message.edit({
      components: [getRow(true)]
    }).catch(() => {});
  });
}

module.exports = { paginate };
