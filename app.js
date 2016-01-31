var config = require('./config.js'); //must export an object with botkey and hodkey

var TelegramBot = require('node-telegram-bot-api');
var bot = new TelegramBot(config.botkey, {polling: true});

var havenondemand = require('havenondemand');
var hod = new havenondemand.HODClient(conifg.hodkey, 'v1');

var scores = {};

var negResponse = [
    'STOP BEING NEGATIVE! 😡',
    'If you keep up this negativity 🔫, you\'ll probably die young 💣',
    'Baaaaaaaaaad negativity 😇',
    'Be more positive! 😬',
    'Maybe that could upset somebody who is more sensitive than you 😭😁'
];

var posResponse = [
    'Calm down, yeah? Bit too positive 😠',
    'Realism is important. Stop being so positive! 😑',
    'Really glad you\'re trying to be positive! Maybe it\'s possible to be too happy?',
    'It\'s a shame that they\'re not as positive as you are'
];

bot.onText(/^\/start$/, function (msg, match) {
  bot.sendMessage(msg.chat.id, 'Negativity kills!! But don\'t worry, because I\'m here to stop you from being too negative 🙃');
});

bot.on('text', function (msg) {
  console.log(msg);
  hod.call('analyzesentiment', { text: msg.text }, function(err, resp, body) {
    if(!scores[msg.chat.id]) {
      scores[msg.chat.id] = 0;
    }
    scores[msg.chat.id] += body.aggregate.score;
    console.log('Text: ' + msg.text);
    console.log(msg.chat.id + ' last score: ' + body.aggregate.score);
    console.log(msg.chat.id + ' total score: ' + scores[msg.chat.id]);
    if(scores[msg.chat.id] < -2) {
      bot.sendMessage(msg.chat.id, negResponse[Math.floor(Math.random()*negResponse.length)]);
      scores[msg.chat.id] = 0;
    }
    if(scores[msg.chat.id] > 2) {
      bot.sendMessage(msg.chat.id, posResponse[Math.floor(Math.random()*posResponse.length)]);
      scores[msg.chat.id] = 0;
    }
  });
});
