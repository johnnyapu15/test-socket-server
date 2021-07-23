// with { "type": "module" } in your package.json
import { createServer } from "http";
import { io, SocketOptions, Socket } from "socket.io-client";
import { Server } from "socket.io";
import { assert } from "chai";
import {Db, Point, RoomDocument, UserDocument} from '../src/interface/dbSchema'

// with { "type": "commonjs" } in your package.json
// const { createServer } = require("http");
// const { Server } = require("socket.io");
// const { Manager, io } = require("socket.io-client");
// const assert = require("chai").assert;



describe("my awesome project", () => {

    before(() => {

    });

    after(() => {

        console.log('after...')
    });

    it("Create room 'test' and disconnect", (done) => {
        const data = {rooms: new Map<string, RoomDocument>(), positions: new Map(), users: new Map()} as Db
        const got = initMember('test', data, () => {disconnect([got]); done();})
    });
    it("Join the room 'test' and update position once.", (done) => {
        const data1: Db = {rooms: new Map(), positions: new Map(), users: new Map()}
        const user1 = initMember('test', data1, undefined, true)
        const data2: Db = {rooms: new Map(), positions: new Map(), users: new Map()}
        const user2 = initMember('test', data2, undefined, true)
        setTimeout(() => {
            user1.position.emit('update', { center: { x: 5, y: 5 } as Point })
            user2.position.emit('update', { center: { x: 1, y: 2 } as Point })
        }, 100)
        
        // 200ms면 모든 작업이 다 되었겠지?
        setTimeout(() => {
            console.log('-----------------------')
            console.log(`${user1.room.id}`)
            console.log(data1)
            console.log(`${user2.room.id}`)
            console.log(data2)
            done()
            disconnect([user1, user2])
        }, 200)
        
    });
});

function disconnect(objs: {room:Socket, user:Socket, position:Socket}[]) {
    objs.forEach(v => {
        v.room.disconnect()
        v.user.disconnect()
        v.position.disconnect()
    })
}

function merge(map: Map<string, object>, id: string, newObj?: object) {
    // 기존 오브젝트와 병합하거나, 삭제한다.
    if (!newObj) {
        map.delete(id)
    } else {
        const preObj = map.get(id)
        
        if (preObj) {
            map.set(id, {...preObj, ...newObj})
        } else {
            map.set(id, newObj)
        }
    }
}

function logging(prefix: string, msg:string, print?: boolean) {
    if (print) {
        console.log(`FROM:${prefix.substr(0,5)} ${msg}`)
    }
}

function initMember(roomId: string, data: Db, done?: Mocha.Done, isPrint?: boolean) {
    const port = process.env.PORT ?? 3000
    const url = `ws://localhost:${port}`
    const opts = {
        transports: ['websocket'],
        autoConnect: false,
        forceNew: true,
        query: {}  
    }

    var roomSocket: Socket, userSocket: Socket, positionSocket: Socket
    const errorHandler = (err) => { logging('error', `${JSON.stringify(err)}`, isPrint) }
    const printCb = (val) => { logging('callback', `${JSON.stringify(val)}`, isPrint) }
    userSocket = io(`${url}/user`, opts)
    positionSocket = io(`${url}/position`, opts)
    roomSocket = io(`${url}/room`, opts)
        .on('error', errorHandler)
        .on("connect", () => {
            const id = roomSocket.id // room socket의 id를 클라이언트의 id로 활용
            logging(id, `1. [connect] room socket. my unique id = ${id}`, isPrint)

            // 'first, connects user, position socket'
            opts.query = { id }
            // user socket init
            var userSocketJoinCallback = async () => { }
            userSocket.connect()
                .on('error', errorHandler)
                .on('connect', () => {
                    logging(id, '2. [connect] user socket', isPrint)
                })
                .on('me', me => {
                    merge(data.users, id, me)
                })
                .on('update', got => {
                    if (!got.user) {
                        logging(id, `user left: ${got.id}`, isPrint)
                    }
                    merge(data.users, got.id, got.user)
                })
            // position socket init
            var positionSocketJoinCallback = async () => { }
            positionSocket.connect()
                .on('error', errorHandler)
                .on('connect', () => {
                    logging(id, '2. [connect] position socket', isPrint)
                })
                .on('update', got => {
                    logging(id, `#. [position-update] ${JSON.stringify(got.position)}`, isPrint)
                    merge(data.positions, got.id, got.position)
                })

            // lets create or join room
            roomSocket.emit('get', roomId, (cb) => {
                if (cb.room) {
                    // room is created already
                    logging(id, '2. the room created already. lets join!', isPrint)
                } else {
                    // we can create the room
                    roomSocket.emit('create', roomId, cb => {
                        if (cb.error) {
                            // error?
                            console.error(`errror when creating the room, msg: ${cb}`)
                            if (done) done()
                            return
                        } else {
                            logging(id, `2. created room: ${JSON.stringify(cb.room)}`, isPrint)
                        }
                    })
                }
                // so there is the room. lets join.
                roomSocket.emit('join', roomId, cb => {
                    if (cb.error) {
                        logging(id, cb.error, isPrint)
                        if (done) done()
                        return
                    } else {
                        logging(id,`2. joined to room: ${JSON.stringify(cb.room)}`, isPrint)
                        merge(data.rooms, cb.id, cb.room)
                    }
                    // if successfully joined to the room, manage other sockets.
                    // user socket
                    userSocket.emit('join', roomId, userSocketJoinCallback)
                    userSocket.emit('list', roomId, list => {
                        list.users.forEach(user => {
                            merge(data.users, user._id, user)
                        });
                    })

                    // position socket
                    positionSocket.emit('join', roomId, positionSocketJoinCallback)

                    if (done) done()
                })
            })
        });
        roomSocket.connect()
    return { room: roomSocket, user: userSocket, position: positionSocket }
}