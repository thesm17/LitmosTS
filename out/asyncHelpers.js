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
var fetch = require('node-fetch');
var baseUrl = "https://api.litmos.com/v1.svc/";
var options = {
    'method': 'GET',
    'muteHttpExceptions': true,
    'headers': {
        'apikey': 'ed8c2c0f-8d9f-4e0d-a4ff-76c897e53c54'
    }
};
function fetcher(url, options) {
    return __awaiter(this, void 0, void 0, function () {
        var response, e_1, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(typeof UrlFetchApp == "undefined")) return [3 /*break*/, 6];
                    console.log("UrlFetchApp is undefined, so attempting to process via plain fetch()");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch(url, options)];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    e_1 = _a.sent();
                    throw new Error(e_1);
                case 5: return [3 /*break*/, 7];
                case 6:
                    //UrlFetchApp is defined, so it is for fetching
                    try {
                        console.log("Using UrlFetchApp for HTTP function.");
                        result = UrlFetchApp.fetch(url, options);
                        return [2 /*return*/, JSON.parse(result.getContentText())];
                    }
                    catch (e) {
                        throw new Error(e);
                    }
                    _a.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * @param username Litmos username following cXXXXuXXXXe pattern
 * @return
 */
function getUser2(username) {
    return __awaiter(this, void 0, void 0, function () {
        var url, user, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = baseUrl + "/users/" + username + "?source=smittysapp&format=json";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetcher(url, options)];
                case 2:
                    user = _a.sent();
                    return [2 /*return*/, user];
                case 3:
                    err_1 = _a.sent();
                    Logger.log(err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getAllCompanyUsers2(companyID) {
    return __awaiter(this, void 0, void 0, function () {
        var url, users;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "https://api.litmos.com/v1.svc/users?source=smittysapp&format=json&search=c" + companyID + "u";
                    return [4 /*yield*/, fetcher(url, options)];
                case 1:
                    users = _a.sent();
                    if (users)
                        return [2 /*return*/, users];
                    else
                        return [2 /*return*/, null];
                    return [2 /*return*/];
            }
        });
    });
}
function getCourseUsers(courseID) {
    return __awaiter(this, void 0, void 0, function () {
        var url, users;
        return __generator(this, function (_a) {
            url = "https://api.litmos.com/v1.svc/courses/" + courseID + "/users?source=smittysapp&format=json";
            try {
                users = fetcher(url, options);
                return [2 /*return*/, users];
            }
            catch (err) {
                Logger.log(err);
            }
            return [2 /*return*/];
        });
    });
}
//# sourceMappingURL=asyncHelpers.js.map