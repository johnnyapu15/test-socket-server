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
var _a;
exports.__esModule = true;
var socket_io_1 = require("socket.io");
var db_1 = require("./mw/db");
var http_1 = require("http");
var localDb_1 = require("./mw/localDb");
var server = http_1.createServer();
var io = new socket_io_1.Server(server, {
    transports: ['websocket'],
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
var sockets = new Map();
var requesters = [];
io.on('connect', function (socket) {
});
/**
 * room namespace가 가장 먼저 생성되므로, 이 socket id를 바탕으로 다른 자원을 관리한다.
 * room:connect => user.id
 *  - user:connect(roomId), position:connect
 *  - room:get
 *  - room:create
 *  - room:join(roomId, nickname)

 *  - room:join => room.id, user.nickname, user.roomId
 *    - user:connect, position:connect
 */
var roomNsp = io.of('/room', function (socket) {
    // connection handler for 'room' namespace.
    console.log('namespace room connected');
    var id = socket.id;
    sockets.set(id, { room: socket });
    socket.on('get', function (roomId, cb) { return __awaiter(void 0, void 0, void 0, function () {
        var got;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("get room " + roomId);
                    return [4 /*yield*/, localDb_1["default"].getRoom(roomId)];
                case 1:
                    got = _a.sent();
                    console.log({ room: got });
                    cb({ "room": got });
                    return [2 /*return*/];
            }
        });
    }); });
    socket.on('create', function (roomId, cb) { return __awaiter(void 0, void 0, void 0, function () {
        var created;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('create room');
                    return [4 /*yield*/, localDb_1["default"].createRoom(roomId, socket.id)];
                case 1:
                    created = _a.sent();
                    cb(created);
                    return [2 /*return*/];
            }
        });
    }); });
    socket.on('join', function (roomId, cb) { return __awaiter(void 0, void 0, void 0, function () {
        var tmpSockets, got;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // join room
                    console.log('join room');
                    if (!roomId) {
                        socket.emit('error', 'invalid param');
                        cb('error');
                        return [2 /*return*/];
                    }
                    tmpSockets = sockets.get(id);
                    if (!tmpSockets || !tmpSockets.room) {
                        socket.emit('error', 'invalid process');
                        console.log(tmpSockets);
                        cb('error');
                        return [2 /*return*/];
                    }
                    tmpSockets.room.join(id);
                    return [4 /*yield*/, localDb_1["default"].getRoom(roomId)];
                case 1:
                    got = _a.sent();
                    cb({ room: got });
                    return [2 /*return*/];
            }
        });
    }); });
    socket.on('delete', function (roomId, cb) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/];
        });
    }); });
});
var userNsp = io.of('/user', function (socket) { return __awaiter(void 0, void 0, void 0, function () {
    var id, tmpSocket, user;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = socket.handshake.query.id;
                if (!id) {
                    socket.emit('error', 'invalid param');
                    return [2 /*return*/];
                }
                console.log('namespace user connected');
                tmpSocket = sockets.get(id);
                if (!tmpSocket) {
                    socket.emit('error', 'invalid process');
                    return [2 /*return*/];
                }
                tmpSocket.user = socket;
                return [4 /*yield*/, localDb_1["default"].touchUser(id, { _id: id })];
            case 1:
                user = _a.sent();
                if (user) {
                    socket.emit('me', user);
                }
                socket.on('join', function (roomId, cb) { return __awaiter(void 0, void 0, void 0, function () {
                    var user;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!roomId) {
                                    socket.emit('error', 'invalid param');
                                    cb('error');
                                    return [2 /*return*/];
                                }
                                socket.join(id);
                                return [4 /*yield*/, localDb_1["default"].touchUser(id, { _id: id, roomId: roomId })]; // user update
                            case 1:
                                user = _a.sent() // user update
                                ;
                                cb(user);
                                return [2 /*return*/];
                        }
                    });
                }); });
                socket.on('list', function (roomId, cb) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        cb(localDb_1["default"].getUsers(roomId));
                        return [2 /*return*/];
                    });
                }); });
                socket.on('update', function (userDoc) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        // set db non-sync
                        localDb_1["default"].touchUser(id, userDoc);
                        // broadcast to the room
                        socket.rooms.forEach(function (room) {
                            userNsp["in"](room).emit('update', userDoc);
                        });
                        return [2 /*return*/];
                    });
                }); });
                socket.on('disconnect', function (reason) {
                    console.log("disconnecting user... " + id);
                    localDb_1["default"].deleteUser(id);
                    // broadcast
                    socket.rooms.forEach(function (room) {
                        roomNsp["in"](room).emit('update'); // userDoc === undefined
                    });
                });
                return [2 /*return*/];
        }
    });
}); });
var positionNsp = io.of('/position', function (socket) { return __awaiter(void 0, void 0, void 0, function () {
    var id, tmpSocket;
    return __generator(this, function (_a) {
        id = socket.handshake.query.id;
        if (!id) {
            socket.emit('error', 'invalid param');
            return [2 /*return*/];
        }
        tmpSocket = sockets.get(id);
        if (!tmpSocket) {
            socket.emit('error', 'invalid process');
            return [2 /*return*/];
        }
        tmpSocket.position = socket;
        console.log('namespace position connected.');
        socket.on('join', function (roomId, cb) { return __awaiter(void 0, void 0, void 0, function () {
            var position;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!roomId) {
                            socket.emit('error', 'invalid param');
                            cb('error');
                            return [2 /*return*/];
                        }
                        socket.join(id);
                        return [4 /*yield*/, localDb_1["default"].touchPosition(id, { _id: id, roomId: roomId, userId: id })];
                    case 1:
                        position = _a.sent();
                        cb(position);
                        return [2 /*return*/];
                }
            });
        }); });
        socket.on('request', function (request) {
            /**
             * request:{ userId, roomId, targetId }
             * 1. relay the request to target user.
             * 2. append the requester into requester[].
             * 3. then, the interval function will send data to requesters.
             */
            console.log('request position');
            requesters.push(socket);
        });
        socket.on('update', function (positionDoc, cb) { return __awaiter(void 0, void 0, void 0, function () {
            var position;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("update position " + positionDoc);
                        return [4 /*yield*/, localDb_1["default"].touchPosition(id, positionDoc)];
                    case 1:
                        position = _a.sent();
                        // broadcast
                        socket.rooms.forEach(function (room) {
                            positionNsp["in"](room).emit('update', position);
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        socket.on('disconnect', function (reason) {
            console.log("disconnecting position... " + id);
            localDb_1["default"].touchPosition(id);
            // broadcast
            socket.rooms.forEach(function (room) {
                positionNsp["in"](room).emit('update'); // userDoc === undefined
            });
        });
        return [2 /*return*/];
    });
}); });
function updater() {
    console.log('intervally updater');
    requesters.forEach(function (socket) {
        // send user2 data to user1
        // 2->1. 3->2. 
        // 특정 유저의 position이 self update인지, followed인지 관리할 수 있으면 좋을듯.
    });
}
// setInterval(updater, 50)
function joinRoom(socket) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, nickname, roomId, isUnique, user;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = socket.handshake.query, nickname = _a.nickname, roomId = _a.roomId;
                    return [4 /*yield*/, db_1.checkNicknameUnique(nickname, roomId)];
                case 1:
                    isUnique = (_b.sent()).isUnique;
                    if (!isUnique) {
                        throw Error('Invalid nickname');
                    }
                    user = { nickname: nickname, roomId: roomId };
                    return [4 /*yield*/, db_1.createUser(user)];
                case 2:
                    _b.sent();
                    socket.join(roomId);
                    return [2 /*return*/];
            }
        });
    });
}
function OnDisconnect(nsp) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/];
        });
    });
}
var port = parseInt((_a = process.env.PORT) !== null && _a !== void 0 ? _a : '3000', 10);
server.listen(port, '0.0.0.0', function () {
    console.log('listeninig...');
});
exports["default"] = server;
