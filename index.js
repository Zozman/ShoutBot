// Loads local enviromental variables if a .env file is provided
require('dotenv').config();

// Helper function to handle Regular Expressions escape
RegExp.escape = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// Helper function to handle a replace all for a string
String.prototype.replaceAll = function(search, replace) {
    return this.replace(new RegExp(RegExp.escape(search),'g'), replace);
};

const { Client, Intents, MessageEmbed, MessageAttachment } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const text2png = require('text2png');
const express  = require('express');
const app = express();

// For local testing, use a defined guild because it's faster
const testGuildId = process.env.TEST_GUILD_ID;

// Create the discord bot
const bot = new Client({ intents: [Intents.FLAGS.GUILDS] });
const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

// Login the bot to discord
bot.login(process.env.BOT_TOKEN);

// Set up message listener when the bot has connected to Discord
bot.on('ready', () => {
   console.log('Shoutbot Lives!');
   // Register the slash commands
   registerComands();
   // Setup listener for chat messages
   setupListener();
   // Update status every minute
   setInterval(updateBotStatus, 60 * 1000);
   // Manually update status now
   updateBotStatus();
});

// Function to register the slash commands to Discord
async function registerComands() {
  // Create the commands
  const commands = [
    // shout command
    new SlashCommandBuilder()
      .setName('shout')
      .setDescription('SHOUTS your input')
      .addStringOption(option =>
        option.setName('input')
          .setDescription('The text to SHOUT back')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('color')
          .setDescription('Optional color to change the SHOUT to (can take english color names or HEX codes)'))
      .addIntegerOption(option =>
        option.setName('size')
          .setDescription('Optional size to change the SHOUT to (in pixels)')),
    // shouthelp command
    new SlashCommandBuilder()
      .setName('shouthelp')
      .setDescription('Get help for Shout Bot')
  ].map(command => command.toJSON());
  
  // If we're testing use the guild command path
  if (testGuildId) {
    try {
      console.log('Started refreshing application (/) commands (TEST GUILD SCOPE).');

      await rest.put(
        Routes.applicationGuildCommands(bot.user.id, testGuildId),
        { body: commands },
      );

      console.log('Successfully reloaded application (/) commands (TEST GUILD SCOPE).');
    } catch (error) {
      console.error(error);
    }
  // Else use the global command path
  } else {
    try {
      console.log('Started refreshing application (/) commands.');

      await rest.put(
        Routes.applicationCommands(bot.user.id),
        { body: commands },
      );

      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error(error);
    }
  }
}

// Function to create the listener for the bot
function setupListener() {
  bot.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    // If it's a help command, show the help
    if (commandName === 'shouthelp') {
      processHelp(interaction);
    // If this is a shout command, process it
    } else if (commandName === 'shout') {
      processMessage(interaction);
    }
  });
}

// Function to keep track of the number of servers running the bot and set it as the status
function updateBotStatus() {
  // Get how many servers are using the bot
    const count = bot && bot.guilds && bot.guilds.cache && bot.guilds.cache.size ? bot.guilds.cache.size : null;
    // If we got a count, update the status to show it
    if (count) {
      bot.user.setPresence({
        activity: {
          name: `SHOUTING on ${count} servers`,
          type: 'PLAYING',
          url: 'https://shoutbot.io'
        },
        status: 'online'
      });
    } else {
      bot.user.setPresence({
        acivity: {
          name: `Ready to start SHOUTING`,
          type: 'PLAYING',
          url: 'https://shoutbot.io'
        },
        status: 'online'
      });
    }
}

// Function to process a message and return a response to the Discord server text channel
async function processMessage(message) {
  // Get inputs
  const input = message.options.getString('input');
  const color = message.options.getString('color');
  const size = message.options.getInteger('size');
  // If we got an input, proceed
  if (input) {
    // First defer the reply so that we have time to compute the response
    await message.deferReply();
    // Separate the message to be one word per line
    const separatedString = input.replaceAll(' ', '\n');
    // Generate the image
    const image = text2png(separatedString, processParameters(color, size));
    // Build the discord message and send it
    const attachment = new MessageAttachment(image, 'shout.png');
    // Now update the reply
    message.editReply({
      files: [attachment]
    });
  } else {
    // Else send back error message
    message.reply('ERROR: Unable to SHOUT');
  }
}

// Function to print help for Shout Bot when !shouthelp is entered
function processHelp(message) {
  // Make sure we have a message
  if (message && message.reply) {
    // Create the embed to use to reply with
    const embed = new MessageEmbed()
      .setColor(0xfffb00)
      .setTitle('Shout Bot Help')
      .setURL(`https://shoutbot.io`)
      .addFields(
        {
          name: 'Basic Usage',
          value: '`/shout input: <CONTENT>` Creates an image of the `<CONTENT>` you entered using default settings.'
        },
        {
          name: 'Set Color',
          value: '`/shout input: <CONTENT> color:<COLOR>` Creates an image of the `<CONTENT>` you entered in the `<COLOR>` you set (can take English color names or hex codes).'
        },
        {
          name: 'Set Size',
          value: '`/shout input: <CONTENT> size:<SIZE>` Creates an image of the `<CONTENT>` you entered in the `<SIZE>` you set (values are in pixels).'
        },
        {
          name: 'Mix It Up',
          value: '`/shout input: <CONTENT> color:<COLOR> size:<SIZE>` You can use any amount of options you want at once.'
        },
      )
      .setFooter('ShoutBot');

    // Reply to the request for help
    message.reply({embeds: [embed], ephemeral: true});
  }
}

// Processes a list of parameters and returns the settings for our text2png function
function processParameters(color, size) {
  // Default output parameters
  const output = {
     font: '60px OpenSans',
     color: 'yellow',
     lineSpacing: 10,
     localFontPath: 'OpenSans-Regular.ttf',
     localFontName: 'OpenSans'
  };
  // If we got a color, change it
  if (color) {
    output.color = color;
  }
  // If we got a size change it
  if (size) {
    output.font = `${size}px OpenSans`
  }
  return output;
}

// Setup static file directory for web interface
app.use(express.static(__dirname + '/public'));

// For avoiding Heroku $PORT error
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Helper method to redirect the user to your discord bot instance invite link
app.get('/invite', function (req, res) {
  res.redirect(`https://discordapp.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=bot%20applications.commands`);
});

app.listen(process.env.PORT || 3000);