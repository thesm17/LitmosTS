"use strict";
function getUserAchievements(username) {
    var allAchievements = getLitmosAchievements(username);
    return allAchievements;
}
var baseUrl = "https://api.litmos.com/v1.svc/";
var options = {
    'method': 'GET',
    'muteHttpExceptions': true,
    'headers': {
        'apikey': 'ed8c2c0f-8d9f-4e0d-a4ff-76c897e53c54'
    }
};
function getUser(username) {
    var url = baseUrl + "/users/" + username + "?source=smittysapp&format=json";
    try {
        var result = UrlFetchApp.fetch(url, options);
        var user = JSON.parse(result.getContentText());
        return user;
    }
    catch (err) {
        Logger.log(err);
    }
}
function getLitmosAchievements(username) {
    var url = "https://api.litmos.com/v1.svc/achievements?userid=" + username + "&source=smittysapp&format=json";
    var result = UrlFetchApp.fetch(url, options);
    var achievements = JSON.parse(result.getContentText());
    var achievementCourseIds = achievements.map(function (achievement) { return achievement.CourseId; });
    return achievementCourseIds;
}
function getAllCompanyUsers(companyID) {
    var url = "https://api.litmos.com/v1.svc/users?source=smittysapp&format=json&search=c" + companyID + "u";
    var result = UrlFetchApp.fetch(url, options);
    var users = JSON.parse(result.getContentText());
    if (users)
        return users;
    else
        return null;
}
function getCourseUsers(courseID) {
    var url = "https://api.litmos.com/v1.svc/courses/" + courseID + "/users?source=smittysapp&format=json";
    try {
        var result = UrlFetchApp.fetch(url, options);
        var users = JSON.parse(result.getContentText());
        return users;
    }
    catch (err) {
        Logger.log(err);
    }
}
//# sourceMappingURL=asyncHelpers.js.map