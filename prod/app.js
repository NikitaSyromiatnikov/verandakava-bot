const { Telegraf, session } = require('telegraf');
const prod = require('./prod.json');

const Bot = new Telegraf(prod.token);

Bot.launch().then(function (ctx) {
    
});