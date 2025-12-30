require('dotenv').config();
const {SlashCommandBuilder, REST, Routes} = require('discord.js');

const commands = [
    new SlashCommandBuilder()
        .setName('find')
        .setDescription('Cari Runner')
        .addStringOption(opt =>
            opt.setName('player')
            .setDescription('Nama player')
            .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('lb')
        .setDescription('Leaderboards RE4 Steam')
        .addStringOption( opt =>
            opt.setName('mode')
                .setDescription('Kategori Run')
                .setRequired(true)
                .addChoices(
                    {name : 'New Game 60 FPS', value: 'ngpro60'},
                    {name : 'New Game 30 FPS', value: 'ngpro30'},
                    {name : 'New Game+ 60 FPS', value: 'ngplus60'},
                    {name : 'Separate Ways 60 FPS', value: 'sw60'},
                    {name : 'Separate Ways 30 FPS', value: 'sw30'},
                    {name : 'Separate Ways+ 60 FPS', value: 'swplus60'},
                    {name : 'Separate Ways+ 30 FPS', value: 'swplus30'},
                    {name : 'Assigment Ada 60 FPS', value: 'aa60'},
                    {name : 'Assigment Ada 30 FPS', value: 'aa30'},
                )

        )
];

const rest = new REST({version: '10'}).setToken(process.env.DISCORD_TOKEN);

(async () =>{
    await rest.put(
        Routes.applicationGuildCommands(
            process.env.APPLICATION_ID,
            process.env.SERVER_ID,
        ),
        {body: commands}
    );
    console.log('command inject');
})();