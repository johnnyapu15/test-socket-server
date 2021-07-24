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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
exports.__esModule = true;
var crypto_1 = require("crypto");
var inMemory = {
    positions: new Map(),
    rooms: new Map(),
    users: new Map()
};
var localDb = {
    checkNickname: function (roomId, nickname) {
        var e_1, _a;
        try {
            // check nickname
            for (var _b = __values(inMemory.users), _c = _b.next(); !_c.done; _c = _b.next()) {
                var item = _c.value;
                // item = [id, userDoc]
                //// same room,
                if (item[1].roomId === roomId) {
                    //// same nickname
                    if (item[1].nickname === nickname) {
                        return false;
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return true;
    },
    touchUser: function (userId, userDoc) { return __awaiter(void 0, void 0, void 0, function () {
        var user;
        var _a;
        return __generator(this, function (_b) {
            if (!userDoc) {
                inMemory.users["delete"](userId);
                return [2 /*return*/, true];
            }
            user = (_a = inMemory.users.get(userId)) !== null && _a !== void 0 ? _a : { _id: userId };
            if (userDoc.nickname) {
                user.nickname = userDoc.nickname;
            }
            if (!user.nickname) {
                // random nickname
                user.nickname = getRandomName();
            }
            if (userDoc.roomId) {
                user.roomId = userDoc.roomId;
            }
            inMemory.users.set(userId, user);
            return [2 /*return*/, user];
        });
    }); },
    getUsers: function (roomId) { return __awaiter(void 0, void 0, void 0, function () {
        var users, _a, _b, item;
        var e_2, _c;
        return __generator(this, function (_d) {
            users = [];
            if (inMemory.rooms.has(roomId)) {
                try {
                    for (_a = __values(inMemory.users), _b = _a.next(); !_b.done; _b = _a.next()) {
                        item = _b.value;
                        if (item[1].roomId === roomId) {
                            users.push(item[1]);
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_b && !_b.done && (_c = _a["return"])) _c.call(_a);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            return [2 /*return*/, users];
        });
    }); },
    onSocketDisconnect: function (socket) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // delete user
            localDb.touchUser(socket.id);
            return [2 /*return*/];
        });
    }); },
    createRoom: function (roomId, socketId) { return __awaiter(void 0, void 0, void 0, function () {
        var created;
        return __generator(this, function (_a) {
            created = false;
            if (!inMemory.rooms.has(roomId)) {
                inMemory.rooms.set(roomId, {
                    _id: roomId,
                    createdDate: new Date().toISOString(),
                    userId: socketId
                });
                created = true;
            }
            if (created) {
                return [2 /*return*/, inMemory.rooms.get(roomId)];
            }
            else {
                return [2 /*return*/, false];
            }
            return [2 /*return*/];
        });
    }); },
    joinRoom: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/];
        });
    }); },
    getRoom: function (roomId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, inMemory.rooms.get(roomId)];
        });
    }); },
    setPosition: function (positionDoc) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            inMemory.positions.set(positionDoc._id, positionDoc);
            return [2 /*return*/];
        });
    }); },
    touchPosition: function (positionId, positionDoc) { return __awaiter(void 0, void 0, void 0, function () {
        var position;
        var _a;
        return __generator(this, function (_b) {
            if (!positionDoc) {
                inMemory.positions["delete"](positionId);
                return [2 /*return*/, true];
            }
            position = (_a = inMemory.positions.get(positionId)) !== null && _a !== void 0 ? _a : { _id: positionId };
            if (positionDoc.center) {
                position.center = positionDoc.center;
            }
            if (positionDoc.zoomLevel) {
                position.zoomLevel = positionDoc.zoomLevel;
            }
            position.timestamp = Date.now();
            inMemory.positions.set(positionId, position);
            return [2 /*return*/, position];
        });
    }); }
};
var firstName = [
    '인정사정없는',
    '개인적인',
    '강인한',
    '우렁찬',
    '착한',
    '오지는',
    '풍성한',
];
var middleName = [
    '😁', '😆', '😍', '😜', '🤣'
];
var lastName = [
    '흥부',
    '놀부',
    '콩쥐',
    '팥쥐',
    '토끼',
    '자라',
    '해님',
    '달님',
    '심청',
    '견우',
    '직녀',
    '장화',
    '홍련',
];
function getRandomName() {
    var i = crypto_1.randomInt(firstName.length);
    var j = crypto_1.randomInt(lastName.length);
    var o = crypto_1.randomInt(middleName.length);
    return firstName[i] + lastName[j] + middleName[o];
}
exports["default"] = localDb;
