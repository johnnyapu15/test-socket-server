// with { "type": "module" } in your package.json
// import { createServer } from "http";
// import { io as Client } from "socket.io-client";
// import { Server } from "socket.io";
// import { assert } from "chai";

// with { "type": "commonjs" } in your package.json
const { createServer } = require("http");
const { Server } = require("socket.io");
const {Manager} = require("socket.io-client");
const assert = require("chai").assert;

describe("my awesome project", () => {
    let manager;
    const port = process.env.PORT ?? 3000
    before((done) => {
        manager = new Manager(`http://localhost:${port}`, {transports:['websocket']})

        done();
    });

    after(() => {
        
        console.log('after...')
    });

    it("should work", (done) => {
        clientSocket = manager.socket(`/room`);
        clientSocket.on("connect", (arg) => {
            console.log(clientSocket.id)
            //assert.equal(arg, "world");
            //done();
            clientSocket.emit('get', (res) => {
                assert.equal(res.namespace, 'room')
            })
            clientSocket.close()
        });
        clientSocket2 = manager.socket(`/position`);
        clientSocket2.on("connect", (arg) => {
            console.log(clientSocket.id)
            //assert.equal(arg, "world");
            clientSocket2.emit('get', (res) => {
                
            })
            clientSocket2.emit('get', (res) => {
                assert.equal(res.namespace, 'position')
                clientSocket2.close()
                done();
            })
            
            
        });
    });
});