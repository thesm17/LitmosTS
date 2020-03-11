function backfillPage1() {
  userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('loopCounter', 3);
  //Commenting out the setPage() to not interfere. Can be reactivated if things get better fixed.
  //setPage(0);
  ScriptApp.newTrigger('runThisNow').timeBased().everyMinutes(1).create();
}

function refreshUserProps() {
  userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('loopCounter', 0);
}

function setPage(page) {
  userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('page', page);
}

function deletePageUpdateTrigger() {
  // Loop over all triggers and delete the ones which are running the updateTrainingStatus function
  var allTriggers = ScriptApp.getProjectTriggers();
  var triggersToDelete = allTriggers.filter(function (trigger) {
    return (trigger.getHandlerFunction()=="runThisNow")
  });

  for (var i = 0; i < triggersToDelete.length; i++) {
    ScriptApp.deleteTrigger(triggersToDelete[i]);
  }
}