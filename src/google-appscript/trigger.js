function createTriggerAfter30Sec() {
    ScriptApp.newTrigger("sendEmailsToDiscord")
        .timeBased()
        .after(1000 * 30)
        .create();
}
