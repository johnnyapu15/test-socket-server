import { Socket } from 'socket.io'
import { Db, PositionDocument, RoomDocument, UserDocument } from "../interface/dbSchema";


const inMemory: Db = {
    positions: new Map<string, PositionDocument>(),
    rooms: new Map<string, RoomDocument>(),
    users: new Map<string, UserDocument>(),
}

const localDb = {
    touchUser: async (socketId: string, nickname: string, roomId?: string) => {
        /**
         * socketId -> join to room of roomId with nickname
         */
        if (roomId) {
            // check nickname
            for (let item of inMemory.users) {
                // item = [id, userDoc]
                //// same room,
                if (item[1].roomId === roomId) {
                    //// same nickname
                    if (item[1].nickname === nickname) {
                        return { valid: false }
                    }
                }
            }
        }
        // user doc base 생성
        const user = {
            _id: socketId,
            nickname,
            roomId
        } as UserDocument
        inMemory.users.set(socketId, user)
        return { valid: true }
    },
    getUsers: async (roomId: string) => {
        let users: UserDocument[] = []
        if (inMemory.rooms.has(roomId)) {
            for (let item of inMemory.users) {
                if (item[1].roomId === roomId) {
                    users.push(item[1])
                }
            }
        }
        return { users }
    },
    deleteUser: (userId: string) => {
        inMemory.users.delete(userId)
    },
    onSocketDisconnect: async (socket: Socket) => {
        // delete user
        localDb.deleteUser(socket.id)
    },
    createRoom: async (roomId: string, socketId: string) => {
        let created = false
        if (!inMemory.rooms.has(roomId)) {
            inMemory.rooms.set(roomId, {
                _id: roomId,
                createdDate: new Date().toISOString(),
                userId: socketId
            } as RoomDocument)
            created = true

        }
        if (created) {
            return inMemory.rooms.get(roomId)
        } else {
            return false
        }
    },
    joinRoom: async () => {
        // store user
    },
    getRoom: async (roomId: string) => {
        return inMemory.rooms.get(roomId)
    },
    setPosition: async (positionDoc: PositionDocument) => {
        inMemory.positions.set(
            positionDoc._id,
            positionDoc
        )
    },
    updatePosition: async (positionId: string, positionDoc: Partial<PositionDocument>) => {
        const position = inMemory.positions.get(positionId)
        if (positionDoc.center) {
            position.center = positionDoc.center
        }
        if (positionDoc.zoomLevel) {
            position.zoomLevel = positionDoc.zoomLevel
        }
        position.timestamp = Date.now()
        inMemory.positions.set(
            positionDoc._id,
            position
        )
    }

}


export default localDb