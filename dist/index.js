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
var server = http_1.createServer();
var io = new socket_io_1.Server(server, {
    transports: ['websocket'],
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
var roomNsp = io.of('/room', function (socket) {
    // connection handler for 'room' namespace.
    console.log('namespace room connected');
    socket.on('create', function () { console.log('create room'); });
    socket.on('join', function () { console.log('join room'); });
    socket.on('get', function (cb) { console.log('get room'); cb({ namespace: 'room' }); });
});
var positionNsp = io.of('/position', function (socket) {
    console.log('namespace position connected');
    // connection handler for 'position' namespace.
    socket.on('request', function () { console.log('request position'); });
    socket.on('get', function (cb) { console.log('get position'); cb({ namespace: 'position' }); });
});
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
var port = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000;
server.listen(port, function () {
    console.log('listeninig...');
});
exports["default"] = server;
