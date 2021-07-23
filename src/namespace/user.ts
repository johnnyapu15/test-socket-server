import { Server } from 'socket.io'
import { UserDocument } from '../interface/dbSchema'
import localDb from '../mw/localDb'

export function initUserNsp(io: Server) {
const userNsp = io.of('/user', async socket => {
    // touch the user data
    const id = socket.handshake.query.id as string
    let roomId
    if (!id) {
        socket.emit('error', 'invalid param')
        return
    }
    console.log('namespace user connected')
    const user = await localDb.touchUser(id, { _id: id })
    if (user) {
        socket.emit('me', user)
    }

    socket.on('join', async (roomIdParam: string, cb) => {
        if (!roomIdParam) {
            socket.emit('error', 'invalid room id')
            cb('error')
            return
        }
        roomId = roomIdParam
        socket.join(roomId)
        const user = await localDb.touchUser(id, { _id: id, roomId }) // user update
        // broadcast to the room
        userNsp.in(roomId).emit('update', {id, user})
        cb({user})
    })
    socket.on('list', async (roomId: string, cb) => {
        const users = await localDb.getUsers(roomId)
        
        cb({users})
    })
    socket.on('init', async (roomId: string) => {
        const users = await localDb.getUsers(roomId)
        users.forEach(user => {
            socket.emit('update', {id:user._id, user})
        })
    })
    socket.on('update', async (user: UserDocument, cb) => {
        if (id !== user._id) {
            const error = 'auth error'
            cb(error)
            return
        }
        // set db non-sync
        localDb.touchUser(id, user)

        // broadcast to the room
        userNsp.in(roomId).emit('update', {id, user})
    })
    socket.on('disconnect', (reason: string) => {
        console.log(`disconnecting user... ${id}`)
        localDb.touchUser(id)
        // broadcast
        userNsp.in(roomId).emit('update', {id}) // userDoc === undefined
    })

})
return userNsp
}