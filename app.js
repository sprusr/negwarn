var config = require('./config.js'); //must export an object with botkey and hodkey

var http = require('http');

var TelegramBot = require('node-telegram-bot-api');
var bot = new TelegramBot(config.botkey, {polling: true});

var havenondemand = require('havenondemand');
var hod = new havenondemand.HODClient(config.hodkey, 'v1');

var scores = {};

var negResponse = [
    'STOP BEING NEGATIVE! 🙉',
    'Keep up this negativity, and you\'ll probably injure yourself',
    'Negativity is bad for you 😇',
    'Be more positive! 😬',
    'Maybe that could upset somebody who is more sensitive than you 😭😁'
];

var posResponse = [
    'Calm down, yeah? Bit too positive 🐍',
    'Realism is important. Stop being so positive! 😑',
    'Really glad you\'re trying to be positive! Maybe it\'s possible to be too happy? 🐙',
    'It\'s a shame that they\'re not as positive as you are '
];

var offensive = false;

process.argv.forEach(function (val, index, array) {
  if(val == '--offensive') {
    offensive = true;
  }
});

bot.onText(/^\/start$/, function (msg, match) {
  bot.sendMessage(msg.chat.id, 'Negativity kills!! But don\'t worry, because I\'m here to stop you from being too negative 🙃');
});

bot.on('text', function (msg) {
  hod.call('analyzesentiment', { text: msg.text }, function(err, resp, body) {
    if(!scores[msg.chat.id]) {
      scores[msg.chat.id] = {
        score: 0,
        negThreshold: -2.5,
        posThreshold: 2.5,
        resetPercent: 0,
        thresholdResetPercent: 120,
        offensiveMode: offensive
      };
    }
    scores[msg.chat.id].score += body.aggregate.score;
    console.log('From: ' + msg.from.first_name + ' Text: ' + msg.text);
    console.log(msg.chat.id + ' last score: ' + body.aggregate.score);
    console.log(msg.chat.id + ' total score: ' + scores[msg.chat.id]);
    if(scores[msg.chat.id].score < scores[msg.chat.id].negThreshold) {
      getNeg(scores[msg.chat.id].offensiveMode, function(neg) {
        bot.sendMessage(msg.chat.id, neg);
        scores[msg.chat.id].score = (scores[msg.chat.id].score/100)*scores[msg.chat.id].resetPercent;
        scores[msg.chat.id].negThreshold = (scores[msg.chat.id].negThreshold/100)*scores[msg.chat.id].thresholdResetPercent;
      });
    }
    if(scores[msg.chat.id] > 2) {
      getPos(function(pos) {
        bot.sendMessage(msg.chat.id, pos);
        scores[msg.chat.id].score = (scores[msg.chat.id].score/100)*scores[msg.chat.id].resetPercent;
        scores[msg.chat.id].posThreshold = (scores[msg.chat.id].posThreshold/100)*scores[msg.chat.id].thresholdResetPercent;
      });
    }
  });
});

bot.onText(/^\/toggleoffensive$/, function (msg, match) {
  var res;
  scores[msg.chat.id].offensiveMode = !scores[msg.chat.id].offensiveMode;
  if(scores[msg.chat.id].offensiveMode) {
    res = 'Offensive mode ON!'
  } else {
    res = 'Offensive mode OFF!'
  }
  bot.sendMessage(msg.chat.id, res);
});

var getPos = function(cb) {
  cb(posResponse[Math.floor(Math.random()*posResponse.length)]);
};

var getNeg = function(offensive, cb) {
  if(offensive) {
    http.request({
      host: 'offensive.site',
      path: '/insult'
    }, function(res) {
      var str = '';

      res.on('data', function (chunk) {
        str += chunk;
      });

      res.on('end', function () {
        cb(str);
      });
    }).end();
  } else {
    cb(negResponse[Math.floor(Math.random()*negResponse.length)]);
  }
};
