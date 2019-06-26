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
  // Make sure there is a message and there is content
  if (message && message.content && message.content.length) {
    // Split the message so we can separate the command from the content
    const splitString = message.content.split(' ');
    // Get the parameters if any are passed in
    const parameterString = splitString[0].replace('!shout', '');
    // Create a string for the rest of the message
    const messageIndex = message.content.indexOf(" ");
    const input = messageIndex && messageIndex !== -1 ? message.content.substr(message.content.indexOf(" ") + 1) : null;
    // If a message was passed in, proceed
    if (input) {
      // Separate the message to be one word per line
      const separatedString = input.replaceAll(' ', '\n');
      // Generate the image
      const image = text2png(separatedString, processParameters(parameterString));
      // Build the discord message and send it
      const attachment = new Discord.Attachment(image, 'shout.png');
      message.channel.send(`From ${message.author}`, attachment);
    } else {
      // Else send back error message
      message.reply('ERROR: Unable to shout');
    }
  }
}

// Processes a list of parameters and returns the settings for our text2png function
function processParameters(input) {
  // Default output parameters
  const output = {
     font: '60px Open Sans Regular',
     color: 'yellow',
     lineSpacing: 10
  };
  // If parameters were passed in, process them
  if (input && input.length) {
    // Separate each option out
    const options = input.startsWith("@") ? input.replace("@", "").split("@") : input.split("@");
    // Font and size have to be returned as 1 output parameter so we will combine these later
    let size = '60px';
    let font = 'Open Sans Regular';
    // For each option, process it
    options.forEach((option) => {
      // Extract the key and the value
      const keyAndValue = option && option.length ? option.split(':') : null;
      const key = keyAndValue && keyAndValue.length && keyAndValue[0] ? keyAndValue[0] : null;
      const value = keyAndValue && keyAndValue.length && keyAndValue[1] ? keyAndValue[1] : null;
      // If we got a valid key and value, use them as input if we offer this parameter
      if (key && value) {
        switch(key) {
          case 'color':
            output.color = value;
            break;
          case 'size':
            // Cover if the user put in the px or not
            size = value && value.indexOf('px') !== -1 ? value : `${value}px`;
            break;
          default:
            break;
        }
      }
    });
    // Re-combine size and font into 1 parameter
    output.font = `${size} ${font}`;
  }
  return output;
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