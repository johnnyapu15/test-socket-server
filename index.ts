import { Server } from 'socket.io'
import { get } from './mw/db'

const io = new Server({
    transports: ['websocket'],
    cors: {
        origin: 'http://curatesome.com',
        methods: ['GET', 'POST']
    }
})

get('test');


