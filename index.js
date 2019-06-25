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

const Discord  = require("discord.js");
const text2png = require('text2png');
const express  = require('express');
const app      = express();

// Create the discord bot
const bot = new Discord.Client({
  autoReconnect: true
});

// Login the bot to discord
bot.login(process.env.BOT_TOKEN);

// Set up message listener when the bot has connected to Discord
bot.on('ready', () => {
   console.log('Shoutbot Lives!');
   setupMessageListener();
});

// Function to create the message listener for the bot
function setupMessageListener() {
  bot.on('message', message => {
    // Exit if any bot; humans only
    if(message.author.bot) return;
    // If this is a shout command, process it
    if (message.content.startsWith("!shout")) {
       processMessage(message);
    }
  });
}

// Function to process a message and return a response to the Discord server text channel
function processMessage(message) {
  const input = message && message.content && message.content.length ? message.content.replace('!shout ', '') : null;
  if (input) {
    const separatedString = input.replaceAll(' ', '\n');
    const image = text2png(separatedString, {
      font: '60px Whitney',
      color: 'yellow',
      lineSpacing: 10
    });
    const attachment = new Discord.Attachment(image, 'shout.png');
    message.channel.send(`From ${message.author}`, attachment);
  } else {
    message.reply('ERROR: Unable to shout');
  }
}

// Setup static file directory for web interface
app.use(express.static(__dirname + '/public'));

// For avoidong Heroku $PORT error
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// Helper method to redirect the user to your discord bot instance invite link
app.get('/invite', function (req, res) {
  res.redirect(`https://discordapp.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=34816&scope=bot`);
});

app.listen(process.env.PORT || 3000);