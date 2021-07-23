import { Server, Socket } from 'socket.io'
import { PositionDocument } from '../interface/dbSchema'
import localDb from '../mw/localDb'


const requesters: Socket[] = []
export function initPositionNsp(io: Server) {
const positionNsp = io.of('/position', async socket => {
    // connection handler for 'position' namespace.
    const id = socket.handshake.query.id as string
    let roomId = ''
    if (!id) {
        socket.emit('error', 'invalid param')
        return
    }    

    console.log('namespace position connected.')

    socket.on('join', async (roomIdParam: string, cb) => {
        if (!roomIdParam) {
            const error = 'invalid room id'
            cb({error})
            return
        }
        roomId = roomIdParam
        socket.join(roomId)
        const position = await localDb.touchPosition(id, { _id: id, roomId, userId: id })
        cb({position})
    })

    socket.on('update', async (positionDoc: Partial<PositionDocument>, cb) => {
        if (!roomId) {
            const error = 'invalid process'
            cb({error})
            return
        }
        if (positionDoc._id && id !== positionDoc._id) {
            const error = 'auth error'
            cb({error})
            return
        }
        console.log(`update position ${positionDoc}`);
        // store db
        const position = await localDb.touchPosition(id, positionDoc) as PositionDocument
        // broadcast
        positionNsp.in(roomId).emit('update', {id, position})
    })

    socket.on('disconnect', (reason: string) => {
        console.log(`disconnecting position... ${id}`)
        localDb.touchPosition(id)
        // broadcast
        positionNsp.in(roomId).emit('update', {id}) // positionDoc === undefined
    })

    
    socket.on('request', (request) => {
        /**
         * request:{ userId, roomId, targetId }
         * 1. relay the request to target user.
         * 2. append the requester into requester[].
         * 3. then, the interval function will send data to requesters.
         */
        console.log('request position')
        requesters.push(socket)
    })
    // update logic
    /**
     * update logic
     * the server manages 'requester[]', the array of socket of requesters that will receive the position they requested,
     * and 'position{}', the dictionary of positions, it maybe contained in DB.
     * server sends the position of requested user to requesters intervally.
     * 
     */
})
return positionNsp
}

function updater() {

    console.log('intervally updater')
    requesters.forEach(socket => {
        // send user2 data to user1
        // 2->1. 3->2. 
        // 특정 유저의 position이 self update인지, followed인지 관리할 수 있으면 좋을듯.
    });
}
// setInterval(updater, 50)