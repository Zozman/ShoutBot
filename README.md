Shout Bot
=====================
A bot for making your Discord conversations LOUD.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Usage
---------
```
!shout HI EVERYBODY
```

![Command Result](https://github.com/Zozman/ShoutBot/blob/master/public/demo.png?raw=true")

```
!shout@color:blue@size:100 HI AGAIN
```

![Command Result 2](https://github.com/Zozman/ShoutBot/blob/master/public/demo2.png?raw=true")

How To Deploy
----------
1. Create a Discord Application at the [Discord Developer Portal](https://discordapp.com/developers)
2. Obtain a `Bot Token` and a `Client ID`
3. Enter these into `.env-template` as well as enter the port you wish for the UI to be served at
4. Rename `.env-template` to `.env`
5. Run `npm install` to install dependencies
6. Run `npm start`

Note: Enviromental variables can be set however you wish; the `.env` method is just provided for convienence

About
---------
Created as part of [Discord Hack Week 2019](https://blog.discordapp.com/discord-community-hack-week-build-and-create-alongside-us-6b2a7b7bba33) by [Zac Lovoy](https://twitter.com/zwlovoy).

![Hack Wumpus](https://github.com/Zozman/ShoutBot/blob/master/public/hack_wump.png?raw=true)