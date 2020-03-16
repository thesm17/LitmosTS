"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var baseUrl = "https://api.litmos.com/v1.svc/";
var options = {
    'method': 'GET',
    'muteHttpExceptions': true,
    'headers': {
        'apikey': 'ed8c2c0f-8d9f-4e0d-a4ff-76c897e53c54'
    }
};
var convertLitmosDate = function (litmosDate) {
    var rawDate = litmosDate;
    var convert = rawDate.substr(-7, 5);
    var conversionFactor = (+convert * 60 * 600);
    var middleDate = rawDate.substr(6);
    var lateDate = middleDate.split("-")[0];
    var usefulDate = new Date(0);
    usefulDate.setMilliseconds(+lateDate + +conversionFactor);
    return usefulDate;
};
var getUserData = function (user) { return __awaiter(void 0, void 0, void 0, function () {
    var userAccountData, allAchievements, recentAchievements, certified, recentCourseTitle, recentCourseCompletionDate;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getUser(user.UserName)];
            case 1:
                userAccountData = (_a.sent());
                return [4 /*yield*/, getLitmosAchievements(user.UserName)];
            case 2:
                allAchievements = _a.sent();
                recentAchievements = getRecentAchievements(allAchievements, 7);
                return [4 /*yield*/, getUserCertificationStatus(allAchievements)];
            case 3:
                certified = _a.sent();
                if (recentAchievements.length > 0) {
                    recentCourseTitle = recentAchievements[0].Title;
                    recentCourseCompletionDate = convertLitmosDate(recentAchievements[0].AchievementDate);
                }
                else {
                    recentCourseTitle = "No recent courses completed";
                    recentCourseCompletionDate = "N/A";
                }
                return [2 /*return*/, {
                        name: userAccountData.FullName,
                        certifiedUser: certified.certificationComplete,
                        certificationStatus: certified,
                        totalCoursesCompleted: allAchievements.length,
                        recentCourseTitle: recentCourseTitle,
                        recentCourseCompletionDate: recentCourseCompletionDate,
                        daysSinceLastLogin: daysSinceLastLogin(userAccountData.LastLogin),
                        daysSinceCreatedDate: daysSinceCreatedDate(userAccountData.CreatedDate)
                    }];
        }
    });
}); };
var daysSinceCreatedDate = function (createdDate) {
    var today = new Date();
    var createDateLog = new Date(createdDate);
    var timeSinceAccountCreate = (+today - +createDateLog);
    var daysSinceAccountCreate = (timeSinceAccountCreate / (1000 * 60 * 60 * 24)).toFixed(2);
    return (daysSinceAccountCreate);
};
var daysSinceLastLogin = function (lastLogin) {
    var today = new Date();
    var lastLog = new Date(lastLogin);
    var timeSinceLastLogin = (+today - +lastLog);
    var daysSinceLastLogin = (timeSinceLastLogin / (1000 * 60 * 60 * 24)).toFixed(2);
    return (daysSinceLastLogin);
};
var getRecentAchievements = function (achievements, numDays) {
    var recent = achievements.filter(function (achievement) {
        var today = new Date();
        var achievementDate = convertLitmosDate(achievement.AchievementDate);
        var daysAgo = ((+today - +achievementDate) / (1000 * 60 * 60 * 24)).toFixed(2);
        return (+daysAgo < numDays);
    });
    return recent;
};
var getUserCertificationStatus = function (userAchievements) { return __awaiter(void 0, void 0, void 0, function () {
    var certExamIds, examsPassed;
    return __generator(this, function (_a) {
        certExamIds = ["PgqK7l17TdE1"];
        if (certExamIds.length == 0) {
            throw new Error("No courses have been specific for awarding certification.");
        }
        examsPassed = userAchievements.filter(function (achievement) { return (certExamIds.includes(achievement.CourseId)); });
        return [2 /*return*/, {
                certificationPercent: (examsPassed.length * 100 / certExamIds.length),
                certificationComplete: Math.floor(examsPassed.length / certExamIds.length),
                examData: {
                    examsPassed: examsPassed.map(function (exam) { return exam.Title; }),
                    completionDates: examsPassed.map(function (exam) { return convertLitmosDate(exam.AchievementDate); })
                }
            }];
    });
}); };
var getAllUserData = function (users) { return __awaiter(void 0, void 0, void 0, function () {
    var userData;
    return __generator(this, function (_a) {
        userData = users.map(function (user) { return __awaiter(void 0, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getUserData(user)];
                    case 1:
                        results = _a.sent();
                        console.log(results);
                        return [2 /*return*/, results];
                }
            });
        }); });
        return [2 /*return*/, Promise.all(userData)];
    });
}); };
var convertThresholdToDate = function (numdays) {
    var d = new Date();
    var datebefore = +d - (+numdays * 1000 * 60 * 60 * 24);
    return datebefore;
};
var getCompanyTrainingStatus = function (companyID, trainingThreshold) { return __awaiter(void 0, void 0, void 0, function () {
    var trainingThresholdDate, users, userData, certifiedUsers, achievementUsers, startedInLastWeekUsers;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                trainingThresholdDate = convertThresholdToDate(trainingThreshold);
                return [4 /*yield*/, getAllCompanyUsers(companyID)];
            case 1:
                users = _a.sent();
                return [4 /*yield*/, getAllUserData(users)];
            case 2:
                userData = _a.sent();
                certifiedUsers = userData.filter(function (user) { return user.certificationStatus.certificationComplete; });
                achievementUsers = userData.filter(function (user) {
                    return ((+user.recentCourseCompletionDate) > trainingThresholdDate);
                });
                startedInLastWeekUsers = userData.filter(function (user) { return user.daysSinceCreatedDate < trainingThreshold; });
                //return certified if the certified array is nonempty
                if (certifiedUsers.length > 0) {
                    return [2 /*return*/, {
                            totalLearners: users.length,
                            trainingStatus: certifiedUsers.length + " certified users",
                            certifiedUsers: certifiedUsers,
                            completedCoursesThisWeek: achievementUsers,
                            startedThisWeek: startedInLastWeekUsers
                        }];
                }
                //return in progress if there have been certifications this week or new users created
                else if (achievementUsers.length || startedInLastWeekUsers.length) {
                    return [2 /*return*/, {
                            totalLearners: users.length,
                            trainingStatus: "In Progress",
                            completedCoursesThisWeek: achievementUsers,
                            startedThisWeek: startedInLastWeekUsers
                        }];
                }
                //return stalled if no progress this week
                else if (Array.isArray(users) && users.length) {
                    return [2 /*return*/, {
                            totalLearners: users.length,
                            trainingStatus: "Stalled",
                            completedCoursesThisWeek: "",
                            startedThisWeek: "",
                            users: users
                        }];
                }
                //return no logins if there are no users
                else
                    return [2 /*return*/, {
                            totalLearners: "0",
                            trainingStatus: "No Users or Logins"
                        }];
                return [2 /*return*/];
        }
    });
}); };
/**
 *
 * @param username from Litmos
 * @returns user data from Litmos
 */
var getUser = function (username) { return __awaiter(void 0, void 0, void 0, function () {
    var url, result, user, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = baseUrl + "/users/" + username + "?source=smittysapp&format=json";
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, fetch(url, options)];
            case 2:
                result = _a.sent();
                return [4 /*yield*/, result.json()];
            case 3:
                user = _a.sent();
                return [2 /*return*/, user];
            case 4:
                err_1 = _a.sent();
                console.log(err_1);
                throw new Error(err_1);
            case 5: return [2 /*return*/];
        }
    });
}); };
var getLitmosAchievements = function (username, since) { return __awaiter(void 0, void 0, void 0, function () {
    var url, url, result, achievements, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (since) {
                    url = "https://api.litmos.com/v1.svc/achievements?userid=" + username + "&source=smittysapp&format=json&since=" + since;
                }
                else {
                    url = "https://api.litmos.com/v1.svc/achievements?userid=" + username + "&source=smittysapp&format=json";
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, fetch(url, options)];
            case 2:
                result = _a.sent();
                return [4 /*yield*/, result.json()];
            case 3:
                achievements = _a.sent();
                return [2 /*return*/, achievements];
            case 4:
                err_2 = _a.sent();
                console.log(err_2);
                throw new Error(err_2);
            case 5: return [2 /*return*/];
        }
    });
}); };
var getAllCompanyUsers = function (companyID) { return __awaiter(void 0, void 0, void 0, function () {
    var url, result, users, err_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = "https://api.litmos.com/v1.svc/users?source=smittysapp&format=json&search=c" + companyID + "u";
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, fetch(url, options)];
            case 2:
                result = _a.sent();
                return [4 /*yield*/, result.json()];
            case 3:
                users = _a.sent();
                return [2 /*return*/, users];
            case 4:
                err_3 = _a.sent();
                console.log(err_3);
                throw new Error(err_3);
            case 5: return [2 /*return*/];
        }
    });
}); };
var companyTrainingStatusGETTest = function (companyID) { return __awaiter(void 0, void 0, void 0, function () {
    var trainingReportThreshold, results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                trainingReportThreshold = 7 //denotes that 7 days is when to check achievement records
                ;
                return [4 /*yield*/, getCompanyTrainingStatus(companyID, trainingReportThreshold)];
            case 1:
                results = _a.sent();
                console.log("\nTraining Results:\n" + JSON.stringify(results));
                return [2 /*return*/];
        }
    });
}); };
companyTrainingStatusGETTest("308479444");
//has 3 certified users:
//runner("308478809");
var parseUsername = function (username) {
    return username.split("u")[0].substr(1);
};
//# sourceMappingURL=manageCerts.js.map