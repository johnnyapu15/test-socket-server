
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

interface Resources {
    room: Socket
    user?: Socket
    position?: Socket
}

const sockets: Map<string, Resources> = new Map()
const requesters: Socket[] = []
io.on('connect', socket => {
})

/**
 * room namespace가 가장 먼저 생성되므로, 이 socket id를 바탕으로 다른 자원을 관리한다.
 * room:connect => user.id
 *  - user:connect(roomId), position:connect
 *  - room:get
 *  - room:create
 *  - room:join(roomId, nickname)

 *  - room:join => room.id, user.nickname, user.roomId
 *    - user:connect, position:connect
 */
const roomNsp = io.of('/room', socket => {
    console.log(socket.handshake.query)
    // connection handler for 'room' namespace.
    console.log('namespace room connected')
    const id = socket.id
    sockets.set(id, { room: socket })

    socket.on('get', async (roomId: string, cb) => {
        console.log(`get room ${roomId}`);
        const got = await localDb.getRoom(roomId)
        console.log({ room: got })
        cb({ "room": got })
    })

    socket.on('create', async (roomId: string, cb) => {
        console.log('create room')
        const created = await localDb.createRoom(roomId, socket.id)
        cb(created)
    })

    socket.on('join', async (roomId: string, cb) => {
        // join room
        console.log('join room')
        if (!roomId) {
            socket.emit('error', 'invalid param')
            cb('error')
            return
        }
        // join sockets
        const tmpSockets = sockets.get(id)
        if (!tmpSockets || !tmpSockets.room) {
            socket.emit('error', 'invalid process')
            console.log(tmpSockets)
            cb('error')
            return
        }

        tmpSockets.room.join(id)
        const got = await localDb.getRoom(roomId)
        cb({ room: got })
    })

    socket.on('delete', async (roomId: string, cb) => {
        // delete room

    })
})


const userNsp = io.of('/user', async socket => {
    console.log(socket.handshake.query)
    // touch the user data
    const id = socket.handshake.query.id as string
    if (!id) {
        socket.emit('error', 'invalid param')
        return
    }
    console.log('namespace user connected')
    const tmpSocket = sockets.get(id)
    if (!tmpSocket) {
        socket.emit('error', 'invalid process')
        return
    }
    tmpSocket.user = socket
    const user = await localDb.touchUser(id, { _id: id })
    if (user) {
        socket.emit('me', user)
    }
    socket.on('join', async (roomId: string, cb) => {
        if (!roomId) {
            socket.emit('error', 'invalid param')
            cb('error')
            return
        }
        socket.join(id)
        localDb.touchUser(id, { _id: id, roomId }) // user update
    })
    socket.on('list', async (roomId: string, cb) => {
        cb(localDb.getUsers(roomId))
    })
    socket.on('update', async (userDoc: UserDocument) => {
        // set db non-sync
        localDb.touchUser(id, userDoc)

        // broadcast to the room
        socket.rooms.forEach((room) => {
            userNsp.in(room).emit('update', userDoc)
        })
    })
    socket.on('disconnect', (reason: string) => {
        console.log(`disconnecting user... ${id}`)
        localDb.deleteUser(id)
        // broadcast
        socket.rooms.forEach((room) => {
            roomNsp.in(room).emit('update') // userDoc === undefined
        })
    })

})


const positionNsp = io.of('/position', async socket => {
    // connection handler for 'position' namespace.
    console.log(socket.handshake.query)
    const id = socket.handshake.query.id as string
    if (!id) {
        socket.emit('error', 'invalid param')
        return
    }
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms, undefined))
    await delay(1000)
    
    const tmpSocket = sockets.get(id)
    if (!tmpSocket) {
        socket.emit('error', 'invalid process')
        return
    }
    tmpSocket.position = socket
    console.log('namespace position connected. it delayed 1000ms!')

    socket.on('join', async (roomId: string, cb) => {
        if (!roomId) {
            socket.emit('error', 'invalid param')
            cb('error')
            return
        }
        socket.join(id)
        localDb.touchPosition(id, { _id: id, roomId, userId: id })
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
    socket.on('update', async (positionId: string, positionDoc: PositionDocument, cb) => {
        console.log(`update position ${positionDoc}`);
        // store db
        const position = await localDb.touchPosition(positionId, positionDoc) as PositionDocument
        // broadcast
        socket.rooms.forEach((room) => {
            positionNsp.in(room).emit('update', position)
        })

    })

    socket.on('disconnect', (reason: string) => {
        console.log(`disconnecting position... ${id}`)
        localDb.touchPosition(id)
        // broadcast
        socket.rooms.forEach((room) => {
            positionNsp.in(room).emit('update') // userDoc === undefined
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
// setInterval(updater, 50)

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

const port = parseInt(process.env.PORT ?? '3000', 10)
server.listen(port, '0.0.0.0', () => {
    console.log('listeninig...')
})


export default server