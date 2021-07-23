
import { Namespace, Server, Socket } from 'socket.io'
import { PositionDocument, UserDocument } from './interface/dbSchema'
import { checkNicknameUnique, createRoom, createUser, } from './mw/db'
import { createServer } from 'http'
import localDb from './mw/localDb'
import { initRoomNsp, initUserNsp, initPositionNsp} from './namespace'

const server = createServer()
const io = new Server(server, {
    transports: ['websocket'],
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})



io.on('connect', socket => {
})

// room namespace listener부터 생성
const roomNsp = initRoomNsp(io)
const userNsp = initUserNsp(io)
const positionNsp = initPositionNsp(io)






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

function initUser(io: Server<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap>) {
    throw new Error('Function not implemented.')
}
