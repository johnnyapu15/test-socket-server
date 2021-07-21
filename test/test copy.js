// with { "type": "module" } in your package.json
// import { createServer } from "http";
// import { io as Client } from "socket.io-client";
// import { Server } from "socket.io";
// import { assert } from "chai";

// with { "type": "commonjs" } in your package.json
const { createServer } = require("http");
const { Server } = require("socket.io");
const { Manager, io } = require("socket.io-client");
const assert = require("chai").assert;

describe("my awesome project", () => {

    before(() => {

    });

    after(() => {

        console.log('after...')
    });

    it("should work", (done) => {
        const got = initMember('test', done)
    });
    it("should work 2", () => {
        const user1 = initMember('test', )
        const user2 = initMember('test', )
        user1.position.emit('update', { center: { x: 1, y: 2 } })
    });
});


function initMember(roomId, done) {
    const port = process.env.PORT ?? 3000
    const url = `ws://localhost:${port}`
    const opts = {
        transports: ['websocket'],
        autoConnect: false,
        forceNew: true,
    }

    var roomSocket, userSocket, positionSocket
    const errorHandler = (err) => { console.log(`[error] ${JSON.stringify(err)}`) }
    const printCb = (val) => { console.log(`[Callback] ${JSON.stringify(val)}`) }
    userSocket = io(`${url}/user`, opts)
    positionSocket = io(`${url}/position`, opts)
    roomSocket = io(`${url}/room`, opts)
        .on('error', errorHandler)
        .on("connect", () => {
            console.log('[connect] room socket')
            const id = roomSocket.id
            console.log(roomSocket.id)
            console.log('first, connects user, position socket')
            opts.query = { id }

            // user socket init
            var userSocketJoinCallback = async () => { }
            userSocket.connect()
                .on('error', errorHandler)
                .on('connect', () => {
                    console.log('[connect] user socket')
                    console.log(userSocket.id)
                    userSocket.emit('join', id, userSocketJoinCallback)
                })
                .on('me', me => {
                    console.log(`Its me! => ${JSON.stringify(me)}`)
                })

            // position socket init
            var positionSocketJoinCallback = async () => { }
            positionSocket.connect()
                .on('error', errorHandler)
                .on('connect', () => {
                    console.log('[connect] position socket')
                    console.log(positionSocket.id)
                    positionSocket.emit('join', id, positionSocketJoinCallback)
                })
                .on('update', position => {
                    console.log(`[position] [update] ${JSON.stringify(position)}`)
                })

            // waiting resource sockets joining...
            //Promise.all([userSocketJoinCallback, positionSocketJoinCallback])
            // HOW TO WAIT ????

            roomSocket.emit('get', roomId, (roomData) => {
                console.log(`got room:${JSON.stringify(roomData)}`)

                if (roomData.room) {
                    // room is created already
                    console.log('the room created already. lets join!')
                } else {
                    // we can create the room
                    roomSocket.emit('create', roomId, cb => {
                        if (!cb) {
                            // error?
                            console.error(`errror???? ${cb}`)
                        } else {
                            console.log(`created room: ${JSON.stringify(cb)}`)
                        }
                    })
                }
                // room is created.
                roomSocket.emit('join', roomId, cb => {
                    if (cb) {
                        console.log(`joined to room: ${JSON.stringify(cb)}`)
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