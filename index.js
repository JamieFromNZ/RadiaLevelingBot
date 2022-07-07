const { Client, Intents, CommandInteractionOptionResolver, MessageEmbed, Message, MessageAttachment, MessageActionRow, MessageButton, ButtonInteraction, MessageSelectMenu, Permissions } = require('discord.js');
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_TYPING,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_MEMBERS,
    ],
    partials: ['MESSAGE', 'REACTION', 'CHANNEL']
});
const { SlashCommandBuilder } = require('@discordjs/builders');

const config = require('./config.json');

const mapOfGuilds = [];
const configGuilds = new Map()
const xpReqlvls = {
    lvl1: 100,
    lvl2: 145,
}

function addLvl(currentLvlXP, level) {
    let lastLvl = xpReqlvls[Object.keys(xpReqlvls).pop()]
    let nextLvlXP = lastLvl * 1.45;
    console.log(nextLvlXP); // NaN
    console.log("Next level XP is " + nextLvlXP + " We got this by multiplying " + lastLvl + " and 1.45");
    let key = "lvl" + level;
    console.log("Key is " + key);
    xpReqlvls[key] = nextLvlXP;
    console.log("Set " + key + " to " + nextLvlXP);
    console.log("XPreq for lvl3 is " + xpReqlvls[key]);
    console.log("-----")
    return nextLvlXP;
}


client.once('ready', () => {
    console.log('logged in!');
    client.user.setPresence({ activity: { name: "you guys talk idk im lonely", type: "LISTENING" }, status: 'dnd' })

    client.application.commands?.create({
        name: 'config',
        description: '🔨 Configure settings for the guild.',
    });


    client.application.commands?.create({
        name: 'togglelevelingsystem',
        description: '🔨 Configure settings for the guild.',
        options: [
            {
                "name": "on",
                "description": "Get or edit permissions for a user",
                "type": 1, // 2 is type SUB_COMMAND_GROUP
            },
            {
                "name": "off",
                "description": "Get or edit permissions for a user",
                "type": 1, // 2 is type SUB_COMMAND_GROUP
            },
        ]
    });


    client.application.commands?.create({
        name: 'setlevelrole',
        description: '🔨 Configure settings for the guild.',
        options: [
            {
                name: 'role',
                description: 'role',
                required: true,
                type: 'ROLE'
            },
            {
                name: 'level',
                description: 'level',
                required: true,
                type: 'NUMBER'
            },
        ],

    });

    client.application.commands?.create({
        name: 'seelevelroles',
        description: '🔨 View guild level roles', // need to add full stop
    });

    client.application.commands?.create({
        name: 'setlevelmsg',
        description: '🔨 Configure settings for the guild.',
        options: [
            {
                name: 'message',
                description: 'msg, use {user} and {level}',
                required: true,
                type: 'STRING'
            },
            {
                name: 'embed',
                description: 'Do you want the msg to be in embed form or not?',
                required: true,
                type: 'BOOLEAN'
            }
        ]
    });

    client.application.commands?.create({
        name: 'seelevelmsg',
        description: '🔨 View guild level-up message.',
    });

    client.application.commands?.create({
        name: 'setleaderboardchannel',
        description: '🔨 Configure settings for the guild.',
        options: [
            {
                name: 'channel',
                description: 'channel',
                required: true,
                type: 'CHANNEL'
            },
        ]
    });

    client.application.commands?.create({
        name: 'removeleaderboardchannel',
        description: '🔨 Configure settings for the guild.',
    });

    console.log("Made config commands");
});

client.on('guildCreate', (guild) => {

    var config = configGuilds.get(guild.id);
    if (!config) {
        config = {
            lvltoggle: 'on',
            xpRoles: undefined,
            lvlMsg: "**GG** {user}, you just advanced to Level **{level}**! <:radiaCheers:992673156877799467>",
            lbChannel: undefined,
            lvlEmb: true
        }

        configGuilds.set(guild.id, config);
    }
});

client.on("messageCreate", async (message) => {
    if (!message.guild) return;
    if (message.author.bot) return;
    console.log("Message created!");

    var config = configGuilds.get(message.guild.id);
    if (!config) {
        config = {
            lvltoggle: 'on',
            xpRoles: undefined,
            lvlMsg: "**GG** {user}, you just advanced to Level **{level}**! <:radiaCheers:992673156877799467>",
            lbChannel: undefined,
            lvlEmb: true
        }
        configGuilds.set(message.guild.id, config);
    }

    if (config.lvltoggle === 'off') return;

    var randomXP = getRandomXP();

    var guildMemberMap = getGuildXpMap(message.guild.id);
    var memberData = guildMemberMap[message.member.id];
    if (!memberData) {
        memberData = {
            xp: 0,
            level: 1
        }
    }

    memberData.xp += randomXP;
    guildMemberMap[message.member.id] = memberData;

    if (isLevelledUp(message.guild.id, message.member.id) == true) {
        console.log("--- levelled up!");
        memberData.level = memberData.level + 1;
        console.log(message.member.user.name + " is now level " + memberData.level);
        guildMemberMap[message.member.id] = memberData;

        message.react("<a:2364_Party_Cat:949944665661116416>");
        if (config.lvlEmb === true) {
            const emb = new MessageEmbed()
                .setDescription("<:radiaLevelUp:992671785755611166> " + config.lvlMsg.toString()
                    .replace("{user}", "<@" + message.member.id + ">")
                    .replace("{level}", memberData.level)
                )
                .setColor("2f3136");
            message.channel.send({ embeds: [emb] });
        } else {
            message.channel.send("<:radiaLevelUp:992671785755611166> " + config.lvlMsg.toString()
                .replace("{user}", "<@" + message.member.id + ">")
                .replace("{level}", memberData.level)
            )
        }
    }

    console.log("XP for " + message.member.user.username + " is now " + memberData.xp);
});

function getRandomXP() {
    return randomAmountOfXp = Math.floor(Math.random() * 9);
}

function getGuildXpMap(guildId) {
    var map = mapOfGuilds[guildId];
    if (!map) {
        map = [];
        mapOfGuilds[guildId] = map;
    }
    return map;
}

function isLevelledUp(guildId, memberId) {
    var guildData = getGuildXpMap(guildId);
    var memberData = guildData[memberId];

    var level = memberData.level.toString();
    var key = "lvl" + level;
    console.log(
        "Key is " + key
    );

    var xpRequired = xpReqlvls[key];
    console.log(xpRequired);

    if ( !xpRequired ) {
        addLvl(xpRequired, memberData.level); // OHHH 
    }
    var xpRequired = xpReqlvls[key];
    console.log(
        "XPReq is " + xpRequired
    );

    if (xpRequired <= memberData.xp) {
        console.log("levelled up yay");
        return true;
    } else {
        return false;
    }
}


////////////////////////////////
//////////// COMMANDS //////////
////////////////////////////////


client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        doCommand(interaction);
    }
    if (interaction.isSelectMenu()) {
        doSelectMenu(interaction);
    }
});

async function doCommand(interaction) {
    const { commandName, options } = interaction;

    if (commandName === 'config') {
        console.log(commandName + " command ran!");

        console.log("Finding file");
        const file = new MessageAttachment('./radioBanner.png');
        console.log("Registered file");

        console.log("Creating select menus");

        const row1 = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('levelling')
                    .setPlaceholder('Configure Levelling/XP System')
                    .addOptions([
                        {
                            label: 'Configure XP level roles',
                            description: 'Roles automatically given when user hits x level',
                            value: 'level_roles',
                        },
                        {
                            label: 'Configure level-up message',
                            description: 'Set the message displayed whenever a user levels up',
                            value: 'level_message',
                        },
                        {
                            label: 'Configure level leaderboard channel',
                            description: 'Set the channel where you want to display the level leaderboard',
                            value: 'leaderboard_channel',
                        }
                    ]),
            );

        console.log("Made select menu");

        console.log("Creating embed");

        const emb = new MessageEmbed()
            .setDescription("Radia is a leveling bot with extremely customizable features. To configure these features, you can run certain commands. For more information, you can select a select menu option below or read on.\n\n<:radiaPoint:992572519175426099> **What is a levelling system?**\nThe user gains XP by sending messages. At XP milestones the user \"levels up\", eg: at 1000 messages a user gets to level `x`. \n<:radiaStar1:992574407639834704> `/toggleLevelingSystem on`\n<:radiastar2:992574400148820028> `/toggleLevelingSystem off`")
            .setColor(3092790)
            .setImage("https://paranor.fr/media/Border.png")
        console.log("Made embed");

        interaction.reply({ components: [row1], files: [file], embeds: [emb] });
    }

    if (commandName === 'togglelevelingsystem') {
        var config = configGuilds.get(interaction.guild.id);
        if (!config) {
            config = {
                lvltoggle: 'on',
                xpRoles: undefined,
                lvlMsg: "**GG** {user}, you just advanced to Level **{level}**! <:radiaCheers:992673156877799467>",
                lbChannel: undefined,
                lvlEmb: true
            }
            configGuilds.set(interaction.guild.id, config);
        }

        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const emb = new MessageEmbed()
                .setDescription("<:radiaCross:993394500099641475> You require `ADMINISTRATOR` permissions to issue this command.")
                .setColor("#36393f")
            interaction.reply({ embeds: [emb] });
            return;
        }

        if (interaction.options.getSubcommand() === 'on') {
            console.log("Leveling system toggle on cmd ran");
            // Do something

            console.log("Leveling system is currently " + config.lvltoggle);

            if (config.lvltoggle === 'on') {
                // Already turned on
                const emb = new MessageEmbed()
                    .setDescription("<:radiaPoint:992572519175426099> This server's levelling system is already toggled to **on**, no changes were made.")
                    .setColor(3092790)
                interaction.reply({ embeds: [emb] });
                return;
            } {
                console.log("Level system is currently turned off, we are going to turn it on"); // Not turned on, turning on now
                config.lvltoggle = 'on';
                console.log("Level system should now be on, it is currently " + config.lvltoggle + ". Sending embed:");
                const emb = new MessageEmbed()
                    .setDescription("<:radiaPoint:992572519175426099> This server's levelling system is now toggled to **on**.")
                    .setColor(3092790)
                interaction.reply({ embeds: [emb] });
                configGuilds.set(interaction.guild.id, config);
                console.log("--------");
            }
        }
        if (interaction.options.getSubcommand() === 'off') {
            console.log("Leveling system toggle off cmd ran");
            // Do something

            console.log("Leveling system is currently " + config.lvltoggle);

            if (config.lvltoggle === 'off') {
                // Already turned off
                const emb = new MessageEmbed()
                    .setDescription("<:radiaPoint:992572519175426099> This server's levelling system is already toggled to **off**, no changes were made.")
                    .setColor(3092790)
                interaction.reply({ embeds: [emb] });
                return;
            } {
                console.log("Level system is currently turned on, we are going to turn it off"); // Not turned on, turning on now
                config.lvltoggle = 'off';
                console.log("Level system should now be off, it is currently " + config.lvltoggle + ". Sending embed:");
                const emb = new MessageEmbed()
                    .setDescription("<:radiaPoint:992572519175426099> This server's levelling system is now toggled to **off**.")
                    .setColor(3092790)
                interaction.reply({ embeds: [emb] });
                configGuilds.set(interaction.guild.id, config);
                console.log("--------");
            }
        }
    }

    if (commandName === 'setleaderboardchannel') {
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const emb = new MessageEmbed()
                .setDescription("<:radiaCross:993394500099641475> You require `ADMINISTRATOR` permissions to issue this command.")
                .setColor("#36393f")
            interaction.reply({ embeds: [emb] });
            return;
        }

        var config = configGuilds.get(interaction.guild.id);
        if (!config) {
            config = {
                lvltoggle: 'on',
                xpRoles: undefined,
                lvlMsg: "**GG** {user}, you just advanced to Level **{level}**! <:radiaCheers:992673156877799467>",
                lbChannel: undefined,
                lvlEmb: true
            }
            configGuilds.set(interaction.guild.id, config);
        }

        console.log("Getting options...");
        var channel = interaction.options.getChannel("channel");
        config.lbChannel = channel;
        console.log("New leaderboard channel is now " + config.lbChannel);

        const emb = new MessageEmbed()
            .setDescription("<:radiaPoint:992572519175426099> This server's leaderboard channel is now set to <#" + config.lbChannel + ">.")
            .setColor(3092790)
        interaction.reply({ embeds: [emb] });
    }

    if (commandName === 'removeleaderboardchannel') {
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const emb = new MessageEmbed()
                .setDescription("<:radiaCross:993394500099641475> You require `ADMINISTRATOR` permissions to issue this command.")
                .setColor("#36393f")
            interaction.reply({ embeds: [emb] });
            return;
        }

        var config = configGuilds.get(interaction.guild.id);
        if (!config) {
            config = {
                lvltoggle: 'on',
                xpRoles: undefined,
                lvlMsg: "**GG** {user}, you just advanced to Level **{level}**! <:radiaCheers:992673156877799467>",
                lbChannel: undefined,
                lvlEmb: true
            }
            configGuilds.set(interaction.guild.id, config);
        }

        config.lbChannel = undefined;
        console.log("Leaderboard channel is now " + config.lbChannel);

        const emb = new MessageEmbed()
            .setDescription("<:radiaPoint:992572519175426099> Successfully removed this server's leaderboard channel.")
            .setColor(3092790)
        interaction.reply({ embeds: [emb] });
    }

    if (commandName === 'setlevelmsg') {
        // Checking for permissions
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const emb = new MessageEmbed()
                .setDescription("<:radiaCross:993394500099641475> You require `ADMINISTRATOR` permissions to issue this command.")
                .setColor("#36393f")
            interaction.reply({ embeds: [emb] });
            return;
        }

        // Setting config and checking if it exists, (I should probably do this in a function but ykyk)
        var config = configGuilds.get(interaction.guild.id);
        if (!config) {
            config = {
                lvltoggle: 'on',
                xpRoles: undefined,
                lvlMsg: "**GG** {user}, you just advanced to Level **{level}**! <:radiaCheers:992673156877799467>",
                lbChannel: undefined,
                lvlEmb: true
            }
            configGuilds.set(interaction.guild.id, config);
        }

        console.log("Fetching ze messahge");
        let msg = interaction.options.getString('message');
        let embed = interaction.options.getBoolean('embed');
        console.log("Msg fetched, setting the message to ze config thingy");
        config.lvlMsg = msg;
        console.log("Embed also fetched a while ago, I'll set it now...");
        config.lvlEmb = embed;
        console.log("Done the setting thing, saving...");
        configGuilds.set(interaction.guild.id, config);
        console.log("Saved, sending embedddd");

        const emb = new MessageEmbed()
            .setDescription("<:radiaPoint:992572519175426099> Successfully set this server's level up message to `" + msg + "`, embed= " + embed)
            .setColor(3092790)
        interaction.reply({ embeds: [emb] }); // WEEEEEeeeeeeeeeeeeeeeeeEEeE
    }

    if (commandName === 'seelevelmsg') {
        // Setting config and checking if it exists
        if (!config) {
            config = {
                lvltoggle: 'on',
                xpRoles: undefined,
                lvlMsg: "**GG** {user}, you just advanced to Level **{level}**! <:radiaCheers:992673156877799467>",
                lbChannel: undefined,
                lvlEmb: true
            }
            configGuilds.set(interaction.guild.id, config);
        }

        const emb = new MessageEmbed()
            .setDescription("<:radiaPoint:992572519175426099> This server's level up message is `" + config.lvlMsg + "`")
            .setColor(3092790)
        interaction.reply({ embeds: [emb] });
    }
}

async function doSelectMenu(interaction) {
    console.log(interaction.values[0])

    const value = interaction.values[0];
    switch (value) {

        // LEVELLING SYSTEM
        case 'level_roles':
            console.log(value + " has been run");
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setLabel('Support Server')
                        .setStyle('LINK')
                        .setURL('https://discord.gg/3EsPwpBaSQ')
                );
            console.log("Made row");

            const file = new MessageAttachment('./radiaXProlesBanner.png'); // Finding and setting file to constant

            const emb = new MessageEmbed()
                .setDescription("Using Radia, you can set certain roles to be awarded when a user hits `x` level. You can customize these roles to have special perks/rewards to further reward engagement.\n\n<:radiaPoint:992572519175426099> **Customization Help**\nTo customize XP roles for this server, you can run the following command:\n<:radiastar2:992574400148820028> `/setLevelRole [role] [level]`\n<:radiaStar1:992574407639834704> `/removeLevelRole [role]`\n\nTo see all XP roles for this server, you can run the following command, you may have up to 50 level roles:\n<:radiastar2:992574400148820028> `/seeLevelRoles`")
                .setColor(3092790)
                .setImage("https://paranor.fr/media/Border.png")

            interaction.reply({ components: [row], files: [file], embeds: [emb], ephemeral: true });
            break;
        case 'level_message':
            console.log(value + " has been run");

            const row1 = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setLabel('Support Server')
                        .setStyle('LINK')
                        .setURL('https://discord.gg/3EsPwpBaSQ')
                );
            console.log("Made row");

            const file1 = new MessageAttachment('./radiaLVLmsgBanner.png'); // Finding and setting file to constant

            const emb1 = new MessageEmbed()
                .setDescription("Radia allows customization of the \"level up\" message. This message is displayed in an embed whenever a user reaches their next XP level. The default level up message is:\n\n**GG** {user}, you just advanced to Level **{level}**! <:radiaCheers:992673156877799467>\n\n<:radiaPoint:992572519175426099> **Customization Help**\nTo customize XP roles for this server, you can run the following command:\n<:radiastar2:992574400148820028> `/setLevelmsg [message]`\n\nTo view the levelup message for this server, you can run the following command:\n<:radiastar2:992574400148820028> `/seeLevelmsg`\n\nYou may use the following two variables in your message:\n<:radiastar2:992574400148820028> `{user}` Mention the user who levelled up.\n<:radiastar2:992574400148820028> `{level}` The level which the user is now.\n\nTo add emojis to the level up message, you must supply then in their ID form:\n`:radiaCheers:`, `<:radiaCheers:992673156877799467>`\n<:radiastar2:992574400148820028> To get the ID form, you can put a backslash (\\\\) before the emoji and press enter.")
                .setColor(3092790)
                .setImage("https://paranor.fr/media/Border.png")

            interaction.reply({ components: [row1], files: [file1], embeds: [emb1], ephemeral: true });
            break;
        case 'leaderboard_channel':
            console.log(value + " has been run");

            const row2 = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setLabel('Support Server')
                        .setStyle('LINK')
                        .setURL('https://discord.gg/3EsPwpBaSQ')
                );
            console.log("Made row");

            const file2 = new MessageAttachment('./radioLBchannelBanner.png'); // Finding and setting file to constant

            const emb2 = new MessageEmbed()
                .setDescription("Using Radia you can set a certain channel to display a live leaderboard of the levels and XP of the top members in your server.\n\n<:radiaPoint:992572519175426099> **Customization Help**\nTo set/remove a channel to display the leaderboard, you can run the following command:\n<:radiastar2:992574400148820028> `/setLeaderboardChannel [channel]`\n<:radiaStar1:992574407639834704>  `/removeLeaderboardChannel`\n\nThis channel's leaderboard will be updated regularly to display the top members in your server. You can also run the `/leaderboard` command to see the server leaderboard.")
                .setColor(3092790)
                .setImage("https://paranor.fr/media/Border.png")

            interaction.reply({ components: [row2], files: [file2], embeds: [emb2], ephemeral: true });
            break;
    }
}

client.login(config.token);
