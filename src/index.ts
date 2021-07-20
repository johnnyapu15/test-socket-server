
import { Namespace, Server, Socket } from 'socket.io'
import { PositionDocument, UserDocument } from './interface/dbSchema'
import { checkNicknameUnique, createRoom, createUser, } from './mw/db'
import { createServer } from 'http'
import localDb from './mw/localDb'

const server = createServer()
const io = new Server(server, {
    transports: ['websocket'],
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

const requesters: Socket[] = []
io.on('connect', socket => {
})
const roomNsp = io.of('/room', socket => {
    // connection handler for 'room' namespace.
    console.log('namespace room connected')

    socket.on('create', async (roomId: string, cb) => {
        console.log('create room')
        const created = await localDb.createRoom(roomId, socket.id)
    })
    socket.on('join', async (roomId: string, nickname: string, cb) => {
        console.log('join room')
        if (!roomId || !nickname) {
            cb('invalid param')
            return
        }
        // join socket
        socket.join(roomId)
        // store user
        await localDb.touchUser(socket.id, nickname, roomId)

        const got = await localDb.getRoom(roomId)
        cb({ room: got })
    })
    socket.on('get', async (roomId: string, cb) => {
        console.log(`get room ${roomId}`);
        const got = await localDb.getRoom(roomId)
        cb({ room: got })
    })

    socket.on('delete', async (roomId: string, cb) => {
        // delete room

    })
})

const userNsp = io.of('/user', socket => {
    console.log('namespace user connected')
    socket.on('list', async (roomId: string, cb) => {
        cb(localDb.getUsers(roomId))
    })
    socket.on('update', async (userDoc: Partial<UserDocument>) => {
        // set db non-sync
            localDb.touchUser(socket.id, userDoc.nickname, userDoc.roomId)
        
        // broadcast to the room
        socket.rooms.forEach((room) => {
            userNsp.in(room).emit('update', userDoc)
        })
    })
    socket.on('disconnect', (reason: string) => {
        console.log(`disconnecting user... ${socket.id}`)
        localDb.deleteUser(socket.id)
        // broadcast
        socket.rooms.forEach((room) => {
            roomNsp.in(room).emit('update') // userDoc === undefined
        })
    })

})

const positionNsp = io.of('/position', socket => {
    console.log('namespace position connected')
    // connection handler for 'position' namespace.
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
    socket.on('update', (positionId: string, positionDoc: PositionDocument, cb) => {
        console.log(`update position ${positionDoc}`);
        // store db
        localDb.updatePosition(positionId, positionDoc)
        // broadcast
        socket.rooms.forEach((room) => {
            positionNsp.in(room).emit('update', positionDoc)
        })

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

function updater() {

    console.log('intervally updater')
    requesters.forEach(socket => {
        // send user2 data to user1
        // 2->1. 3->2. 
        // 특정 유저의 position이 self update인지, followed인지 관리할 수 있으면 좋을듯.
    });
}
setInterval(updater, 50)

async function joinRoom(socket: Socket) {
    const { nickname, roomId } = socket.handshake.query
    // check that is the nickname unique
    const { isUnique } = await checkNicknameUnique(nickname as string, roomId as string)

    if (!isUnique) {
        throw Error('Invalid nickname')
    }

    const user = { nickname, roomId } as UserDocument
    await createUser(user)
    socket.join(roomId as string)
}

async function OnDisconnect(nsp: Namespace) {
    // 해당 네임스페이스의 자원 삭제


}

const port = process.env.PORT ?? 3000
server.listen(port, () => {
    console.log('listeninig...')
})


export default server