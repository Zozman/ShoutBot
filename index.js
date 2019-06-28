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
   // Setup listener for chat messages
   setupMessageListener();
   // Update status every minute
   bot.setInterval(updateBotStatus, 60 * 1000);
   // Manually update status now
   updateBotStatus();
});

// Function to create the message listener for the bot
function setupMessageListener() {
  bot.on('message', message => {
    // Exit if any bot; humans only
    if(message.author.bot) return;
    // If this is a shout command, process it
    if (message.content.startsWith("!shout")) {
       processMessage(message);
    } else if (message.content.startsWith("!shouthelp")) {
       processHelp(message);
    }
  });
}

// Function to keep track of the number of servers running the bot and set it as the status
function updateBotStatus() {
  // Get how many servers are using the bot
    const count = bot && bot.guilds && bot.guilds.array() ? bot.guilds.array().length : null;
    // If we got a count, update the status to show it
    if (count) {
      bot.user.setPresence({
        game: {
          name: `SHOUTING on ${count} servers`,
          type: 'PLAYING'
        },
        status: 'online'
      });
    } else {
      bot.user.setPresence({
        game: {
          name: `Ready to start SHOUTING`,
          type: 'PLAYING'
        },
        status: 'online'
      });
    }
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

function processHelp(message) {
  if (message && message.reply) {
    message.reply('Shout Bot Help', {
      embed: {
        color: 'yellow',
        fields: [
          {
            name: 'Basic Usage',
            value: '`!shout <CONTENT>` Creates an image of the `<CONTENT>` you entered using default settings'
          },
          {
            name: 'Set Color',
            value: '`!shout@color:<COLOR> <CONTENT>` Creates an image of the `<CONTENT>` you entered in the `<COLOR>` you set (can take English color names or hex codes)'
          },
          {
            name: 'Set Size',
            value: '`!shout@size:<SIZE> <CONTENT>` Creates an image of the `<CONTENT>` you entered in the `<SIZE>` you set (values are in pixels)'
          },
          {
            name: 'Mix It Up',
            value: '`!shout@color:<COLOR>@size:<SIZE> <CONTENT>` You can use any amount of options you want at once'
          }
        ]
      }
    });
  }
}

// Processes a list of parameters and returns the settings for our text2png function
function processParameters(input) {
  // Default output parameters
  const output = {
     font: '60px OpenSans',
     color: 'yellow',
     lineSpacing: 10,
     localFontPath: 'OpenSans-Regular.ttf',
     localFontName: 'OpenSans'
  };
  // If parameters were passed in, process them
  if (input && input.length) {
    // Separate each option out
    const options = input.startsWith("@") ? input.replace("@", "").split("@") : input.split("@");
    // Font and size have to be returned as 1 output parameter so we will combine these later
    let size = '60px';
    let font = 'OpenSans';
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