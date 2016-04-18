var Botkit = require('botkit')

// Expect a SLACK_TOKEN environment variable
var slackToken = process.env.SLACK_TOKEN
if (!slackToken) {
  console.error('SLACK_TOKEN is required!')
  process.exit(1)
}
//

var controller = Botkit.slackbot()
var bot = controller.spawn({
  token: slackToken
})

bot.startRTM(function (err, bot, payload) {
  if (err) {
    throw new Error('Could not connect to Slack')
  }
})

//FINDING USERNAME

controller.hears(['hello', 'hi'], 'direct_message', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hello. I\'m Trent, your trusty friend to help you with your water supply. What is your name?');
        }
    });
});

controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

//EASY REPLY

controller.hears(['can I have some water'], ['direct_message'], function (bot, message) {
  bot.reply(message, 'Of course you can')
})

//CONVERSATION

controller.hears(['read'],['direct_message'],function(bot,message) {
  bot.startConversation(message, askReading);
});

askReading = function(response, convo) {
  convo.say("Hello. It's that time of year where again where I need to get you to take a meter reading.")
  convo.ask("Please could you do so and let me know what is is?", function(response, convo) {
    convo.say("Thank you very much.");
    askCheck(response, convo);
    convo.next();
  });
}
askCheck = function(response, convo) {
  convo.ask("You said " + response.text + ", have I got that right?", function(response, convo) {
    convo.say("Good! I'll just calculate your bill for this quater");
    convo.say("Based on a rate of 148.39p per cubic metre your bill is £83.25");
    askCardpayment(response, convo);
    convo.next();
  });
}
askCardpayment = function(response, convo) { 
  convo.say("If you're ready to pay now lets go ahead.")
  convo.say("Severn Trent does not store any of your card details.")
  convo.ask("What is your card number?", function(response, convo) {
    convo.say(response.text + ", great.");
    askSecuritycode(response, convo);
    convo.next();
  });
}
askSecuritycode = function(response, convo) { 
    convo.ask("What is your security code?", function(response, convo) {
    convo.say(response.text + ", perfect.");
    convo.next();
  });
}

//INCIDENT

controller.hears(['incident'], ['direct_message'], function (bot, message) {
  bot.reply(message, "Sorry to interrupt you but I have some important news.")
  bot.reply(message, "Sorry") 
 })



//HELP

controller.hears('help', ['direct_message', 'direct_mention'], function (bot, message) {
  var help = 'I will respond to the following messages: \n' +
      '`bot hi` for a simple message.\n' +
      '`bot attachment` to see a Slack attachment message.\n' +
      '`@<your bot\'s name>` to demonstrate detecting a mention.\n' +
      '`bot help` to see this again.'
  bot.reply(message, help)
})

//ATTACHMENT

controller.hears(["I'm struggling to pay my bill"], ['direct_message', 'direct_mention'], function (bot, message) {
  var text = 'We’re working to help those who struggle the most with their water bills through The Big Difference Scheme.'
  var attachments = [{
    fallback: text,
    pretext: 'Do your bills feel like too much?',
    title: 'The Big Difference Scheme',
    image_url: 'https://s3-eu-west-1.amazonaws.com/media.aws.stwater.co.uk/upload/img/BDSLogo.png',
    title_link: 'https://www.stwater.co.uk/my-account/about-your-account-and-bill/trouble-paying-your-bill/big-difference-scheme/',
    text: text,
    color: '#7CD197'
  }]

  bot.reply(message, {
    attachments: attachments
  }, function (err, resp) {
    console.log(err, resp)
  })
}
)

//DOESN'T UNDERSTAND

controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
  bot.reply(message, 'Sorry <@' + message.user + '>, I don\'t understand. \n')
})

