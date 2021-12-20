function sendEmailsToDiscordMain() {
  sendEmailsToDiscord();
  deleteTrigger();
  createTriggerAfter30Sec();
}

function sendEmailsToDiscord() {
  var label = GmailApp.getUserLabelByName('thetanarena');
  var messages = [];
  var threads = label.getThreads();

  for (var i = 0; i < threads.length; i++) {
    messages = messages.concat(threads[i].getMessages())
  }

  const list = [];
  if (messages.length > 0) {
    for (var i = 0; i < messages.length; i++) {
      var message = messages[i];
      const json = {
        "from": message.getFrom(),
        "to": message.getTo(),
        //"subject":message.getSubject(),
        "code": /([0-9]{6})/.exec(message.getSubject())[0],
        //"body":message.getPlainBody(),
      };
      list.push(json);
      message.markRead();
    }
    sendMessage({ content: '!fromG ' + JSON.stringify(list) });
  }

  // remove the label from these threads so we don't send them to
  // slack again next time the script is run
  label.removeFromThreads(threads);
}

function sendMessage(messageJson) {
  const webhookUrl = '';

  const payload = JSON.stringify(messageJson);

  const params = {
    headers: { 'Content-Type': 'application/json' },

    payload: payload,
    muteHttpExceptions: true,
  };
  params['method'] = 'POST';

  UrlFetchApp.fetch(webhookUrl, params);
}

