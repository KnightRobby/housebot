request = require('node-request-caching');

var votesRequired = 8;
var strobeCount = 8;
var numFlips = 0;
var lights_owner = 'glacials'; // Getting removed soon

var polls = {
  lights: {
    on:  0,
    off: 0,
    strobe: 0
  }
};

var check_stream = function (user, options) {
  options = options || {};
  request.get('https://api.twitch.tv/kraken/streams/djwheat', {}, 600, function (error, response, body) {
    if (JSON.parse(body).stream !== null) {
      options.online();
    }
  });
};

var triggers = {
  lights: {
    on: function(bot, channel, devices) {
      numFlips++;
      bot.say(channel, 'Lights turning on! (flip #'+numFlips+')');
      devices[3].turn_on();
    },
    off: function(bot, channel, devices) {
      numFlips++;
      bot.say(channel, 'Lights turning off! (flip #'+numFlips+')');
      devices[3].turn_off();
    },
    strobe: function(bot, channel, devices) {
      numFlips += strobeCount * 2;
      bot.say(channel, 'Lights on strobe!');
      for (var i = 0; i < strobeCount; i++) {
        setTimeout(devices[3].turn_off, i * 1000);
        setTimeout(devices[3].turn_on,  i * 1000 + 500);
      }
    }
  }
};

module.exports = function(argv, options) {
  options = options || {};
  return {
    valid: (argv.length === 1 && argv[0] === 'vote') ||
           (argv.length === 2 && argv[0] === 'vote' && argv[1] in polls) ||
           (argv.length === 3 && argv[0] === 'vote' && argv[1] in polls && argv[2] in polls[argv[1]]) ||
           (argv.length === 1 && argv[0] in polls) ||
           (argv.length === 2 && argv[0] in polls && argv[1] in polls[argv[0]]),
    run: function() {
      if (options.channel !== lights_owner && options.user.name !== 'housebot') {
        return;
      }
      if (!options.devices[3]) {
        options.bot.say(options.channel, "I'm not hooked up to any lights right now!");
        return;
      }
      if (argv[0] !== 'vote') {
        argv = ['vote'].concat(argv);
      }
      if (argv.length === 1) {
        options.bot.say(options.channel, 'open polls → '+Object.keys(polls).join(' '));
      } else if (argv.length === 2) {
        response = 'candidates for '+argv[1]+' → ';
        Object.keys(polls[argv[1]]).forEach(function(candidate, numVotes, options) {
          response += candidate+' ';
        });
        options.bot.say(options.channel, response);
      } else if (argv.length === 3) {
        polls[argv[1]][argv[2]]++;
        if (polls[argv[1]][argv[2]] >= votesRequired) {
          check_stream(options.user.name, { online: function() {
            if (JSON.parse(body).stream !== null) {
              triggers[argv[1]][argv[2]](options.bot, options.channel, options.devices);
              Object.keys(polls[argv[1]]).forEach(function(candidate, numVotes, options) {
                polls[argv[1]][candidate] = 0;
              });
            }
          }});
        } else {
          options.bot.say(options.channel, argv[1]+' '+argv[2]+' → now '+polls[argv[1]][argv[2]]+' (need '+(votesRequired - polls[argv[1]][argv[2]])+' more)');
        }
      }
      var votes = 0;
    }
  };
};
