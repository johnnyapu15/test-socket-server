
import { Server } from 'socket.io'
import { RoomDocument } from '../interface/dbSchema'
import localDb from '../mw/localDb'


/**
 * room namespace가 가장 먼저 생성되므로, 이 socket id를 바탕으로 다른 자원을 관리한다. 다른 클라이언트 id가 있다면 대체해도 무방함.
 * room:connect => user.id
 *  - user:connect(roomId), position:connect
 *  - room:get
 *  - room:create
 *  - room:join(roomId, nickname)

 *  - room:join => room.id, user.nickname, user.roomId
 *    - user:connect, position:connect
 */

export function initRoomNsp(io: Server) {
 const roomNsp = io.of('/room', socket => {
    // connection handler for 'room' namespace.
    var id = socket.handshake.query.id as string
    if (!id) {
        id = socket.id
    }
    console.log('namespace room connected')

    socket.on('get', async (roomId: string, cb) => {
        console.log(`get room ${roomId}`);
        const got = await localDb.getRoom(roomId)
        console.log({ room: got })
        cb({ id: roomId, 'room': got })
    })

    socket.on('create', async (roomId: string, cb) => {
        console.log('create room')
        const created = await localDb.createRoom(roomId, socket.id)
        if (!created) {
            const error = 'the room is not created'
            cb({error})
            return
        } 
        cb({id: roomId, room:created})
    })

    socket.on('join', async (roomId: string, cb) => {
        // join room
        console.log('join room')
        if (!roomId) {
            const error = 'invalid room id'
            cb({error})
            return
        }
        
        const got = await localDb.getRoom(roomId)

        if (!got) {
            const error = 'invalid room id'
            cb({error})
            return
        }
        // join sockets
        socket.join(roomId)
        cb({id: roomId, room: got })
    })

    socket.on('update', async (room: RoomDocument, cb) => {
        const roomId = room._id
        if (!roomId) {
            const error = 'invalid room id'
            cb({error})
            return 
        }
        const got = await localDb.getRoom(roomId)
        if (!got) {
            const error = 'invalid room id'
            cb({error})
            return 
        }
        if (id !== got.userId) {
            const error = 'auth error'
            cb({error})
            return 
        }
        // update the room.
    })
})
return roomNsp
}
