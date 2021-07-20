// with { "type": "module" } in your package.json
// import { createServer } from "http";
// import { io as Client } from "socket.io-client";
// import { Server } from "socket.io";
// import { assert } from "chai";

// with { "type": "commonjs" } in your package.json
const { createServer } = require("http");
const { Server } = require("socket.io");
const {Manager, io} = require("socket.io-client");
const assert = require("chai").assert;

describe("my awesome project", () => {
    let manager;
    const port = process.env.PORT ?? 3000
    const url = `ws://localhost:${port}`
    const opts = {
        transports: ['websocket'],
        forceNew: false,
    }
    before((done) => {
        manager = new Manager(url, opts)
        done();
    });

    after(() => {
        
        console.log('after...')
    });

    it("should work", (done) => {

        const roomId = 'test-room'
        const nickname = 'nickname1'

        const errorHandler = (err) => {console.log(`[error] ${err}`)}
        roomSocket = io(`${url}/room`, opts);
        roomSocket.on('error', errorHandler)
        
        roomSocket.on("connect", () => {
            console.log('[connect] room socket')
            
            const id = roomSocket.id
            console.log(roomSocket.id)
            console.log('first, connects user, position socket')
            
            //
            var userSocketJoinCallback = async () =>  {}
            userSocket = io(`${url}/user?id=${id}`, opts);
            console.log(opts)
            userSocket.on('error', errorHandler)
            userSocket.on('connect', () => {
                console.log('[connect] user socket')
                console.log(userSocket.id)
                userSocket.emit('join', id, userSocketJoinCallback)
            })

            //
            var positionSocketJoinCallback = async () =>  {}
            positionSocket = io(`${url}/position?id=${id}`, opts);
            
            positionSocket.on('error', errorHandler)
            positionSocket.on('connect', () => {
                console.log('[connect] position socket')
                console.log(positionSocket.id)
                positionSocket.emit('join', id, positionSocketJoinCallback)
            })

            // waiting resource sockets joining...
            Promise.all([userSocketJoinCallback, positionSocketJoinCallback])

            roomSocket.emit('get', roomId, (roomData) => {
                console.log(`got room: ${roomData}`)
                
                if (roomData.room) {
                    // room is created already
                } else {
                    // we can create the room
                    roomSocket.emit('create', roomId, cb => {
                        if (!cb) {
                            // error?
                        } else {
                            console.log(`created room: ${cb}`)
                        }
                    })
                }
                // room is created.
                roomSocket.emit('join', roomId, cb => {
                    if (cb) {
                        console.log(`joined to room: ${cb}`)
                        done()
                        roomSocket.close()
                        userSocket.close()
                        positionSocket.close()
                    }
                })
                
                
            })
            
        });
    });
});