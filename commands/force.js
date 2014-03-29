var lights_owner = 'glacials'; // Getting removed soon

var args = {
  'lights on': function(bot, channel, devices) {
    bot.say(channel, 'Forcing lights on.');
    devices[3].turn_on();
  },
  'lights off': function(bot, channel, devices) {
    bot.say(channel, 'Forcing lights off.');
    devices[3].turn_off();
  }
};

module.exports = function(argv, options) {
  options = options || {};
  return {
    valid: argv[0] === 'force',
    run: function() {
      if (options.user.name !== lights_owner && options.user.name !== 'housebot') {
        options.bot.say(options.channel, 'Only the device owner can force actions!');
        return;
      }
      if (!options.devices[3]) {
        options.bot.say(options.channel, "I'm not hooked up to any lights right now!");
        return;
      }
      arg = argv.slice(1).join(' ');
      if(arg in args) {
        args[arg](options.bot, options.channel, options.devices);
      }
    }
  };
};
