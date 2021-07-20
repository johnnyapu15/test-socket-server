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
            const id = clientSocket.id
            userSocket = manager.socket('/user', id)
            positionSocket = manager.socket('/position', id)

            
            clientSocket.emit('get', 'test', (res) => {
            
                
                
                done()
                clientSocket.close()
            })
            
        });
        clientSocket2 = manager.socket(`/position`);
        clientSocket2.on("connect", (arg) => {
            console.log(clientSocket2.id)           
            
        });
    });
});