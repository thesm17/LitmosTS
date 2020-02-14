// Compiled using ts2gas 3.4.4 (TypeScript 3.7.5)
var exports = exports || {};
var module = module || { exports: exports };
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
        'apikey': '4577fd81-69cd-4d49-bccb-03282a1a09f8'
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
//# sourceMappingURL=module.js.map