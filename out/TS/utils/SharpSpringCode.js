"use strict";
/**
 * userData: {
    name
    email
    certifiedUser
    certificationStatus
    totalCoursesCompleted
    recentCourseTitle
    recentCourseCompletionDate
    daysSinceLastLogin
    daysSinceCreatedDate
  }
 *
 */
//user training status custom field ID is user_training_status_5e4448ef870c8
function updateShSpTrainingStatus(allUsersData) {
    var usersTrainingStatus = allUsersData.map(function (user) {
        return parseTrainingStatus(user);
    });
    var shspResponse = updateSharpSpringLeads(usersTrainingStatus);
    return shspResponse;
}
function parseTrainingStatus(userTrainingData) {
    var trainingStatus;
    if (userTrainingData.certifiedUser > 0.99) {
        trainingStatus = "Certified User";
    }
    else if (userTrainingData.recentCourseCompletionDate != "") {
        trainingStatus = "In Progress";
    }
    else {
        trainingStatus = "Stalled";
    }
    return { "emailAddress": userTrainingData.email, "user_training_status_5e4448ef870c8": trainingStatus };
}
//# sourceMappingURL=SharpSpringCode.js.map