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

    it("should work", (done) => {
        const data = {rooms: new Map<string, RoomDocument>(), positions: new Map(), users: new Map()} as Db
        const got = initMember('test', data, done)
    });
    it("should work 2", (done) => {
        const data1: Db = {rooms: new Map(), positions: new Map(), users: new Map()}
        const user1 = initMember('test', data1, undefined, true)
        const data2: Db = {rooms: new Map(), positions: new Map(), users: new Map()}
        const user2 = initMember('test', data2, undefined, true)
        user2.position.emit('update', { center: { x: 1, y: 2 } as Point })
        // 200ms면 모든 작업이 다 되었겠지?
        setTimeout(() => {
            console.log('-----------------------')
            console.log(`${user1.room.id}`)
            console.log(data1)
            console.log(`${user2.room.id}`)
            console.log(data2)
            done()
        }, 200)
        
    });
});

function merge(map: Map<string, object>, id: string, newObj: object) {
    const preObj = map.get(id)
    if (preObj) {
        map.set(id, {...preObj, ...newObj})
    } else {
        map.set(id, newObj)
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
            const id = roomSocket.id
            logging(id, `1. [connect] room socket. my unique id = ${id}`, isPrint)
            // 'first, connects user, position socket'
            opts.query = { id }
            
            // user socket init
            var userSocketJoinCallback = async () => { }
            userSocket.connect()
                .on('error', errorHandler)
                .on('connect', () => {
                    logging(id, '2. [connect] user socket', isPrint)
                    userSocket.emit('join', roomId, userSocketJoinCallback)
                    userSocket.emit('list', roomId, list => {
                        list.users.forEach(user => {
                            merge(data.users, user._id, user)
                        });
                    })
                })
                .on('me', me => {
                    merge(data.users, id, me)
                })
                .on('update', user => {
                    merge(data.users, user._id, user)
                })

            // position socket init
            var positionSocketJoinCallback = async () => { }
            positionSocket.connect()
                .on('error', errorHandler)
                .on('connect', () => {
                    logging(id, '2. [connect] position socket', isPrint)
                    positionSocket.emit('join', id, positionSocketJoinCallback)
                })
                .on('update', position => {
                    logging(id, `#. [position] [update] ${JSON.stringify(position)}`, isPrint)
                    merge(data.positions, position._id, position)
                })

            // waiting resource sockets joining...
            //Promise.all([userSocketJoinCallback, positionSocketJoinCallback])
            // HOW TO WAIT ????

            roomSocket.emit('get', roomId, (roomData) => {
                if (roomData.room) {
                    // room is created already
                    logging(id, '2. the room created already. lets join!', isPrint)
                } else {
                    // we can create the room
                    roomSocket.emit('create', roomId, cb => {
                        if (!cb) {
                            // error?
                            console.error(`errror???? ${cb}`)
                        } else {
                            logging(id, `2. created room: ${JSON.stringify(cb)}`, isPrint)
                        }
                    })
                }
                // room is created.
                roomSocket.emit('join', roomId, cb => {
                    if (cb) {
                        logging(id,`2. joined to room: ${JSON.stringify(cb)}`, isPrint)
                        merge(data.rooms, roomId, cb.room)
                        // join other resources
                        userSocket.emit('join', roomId, printCb)
                        positionSocket.emit('join', roomId, printCb)
                        if (done) done()
                    }
                })
            })
        });
        roomSocket.connect()
    return { room: roomSocket, user: userSocket, position: positionSocket }
}