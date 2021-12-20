function createTriggerAfter30Sec() {
    ScriptApp.newTrigger("sendEmailsToDiscord")
        .timeBased()
        .after(1000 * 30)
        .create();
}
function deleteTrigger() {
    const triggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < triggers.length; i++) {
        if (triggers[i].getHandlerFunction() == 'sendEmailsToDiscord') {
            ScriptApp.deleteTrigger(triggers[i]);
        }
    }
}
