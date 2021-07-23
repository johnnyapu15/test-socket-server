import { randomInt } from 'crypto';
import { Socket } from 'socket.io'
import { Db, PositionDocument, RoomDocument, UserDocument } from "../interface/dbSchema";


const inMemory: Db = {
    positions: new Map<string, PositionDocument>(),
    rooms: new Map<string, RoomDocument>(),
    users: new Map<string, UserDocument>(),
}

const localDb = {
    checkNickname: (roomId: string, nickname: string) => {
        // check nickname
        for (let item of inMemory.users) {
            // item = [id, userDoc]
            //// same room,
            if (item[1].roomId === roomId) {
                //// same nickname
                if (item[1].nickname === nickname) {
                    return false
                }
            }
        }
        return true
    },
    touchUser: async (userId: string, userDoc?: UserDocument) => {
        if (!userDoc) {
            inMemory.users.delete(userId)
            return true
        }
        const user = inMemory.users.get(userId) ?? { _id: userId } as UserDocument

        if (userDoc.nickname) {
            user.nickname = userDoc.nickname
        } 
        if (!user.nickname) {
            // random nickname
            user.nickname = getRandomName()
        }
        if (userDoc.roomId) {
            user.roomId = userDoc.roomId
        }
        inMemory.users.set(userId, user)

        return user
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
        return users
    },
    onSocketDisconnect: async (socket: Socket) => {
        // delete user
        localDb.touchUser(socket.id)
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
    touchPosition: async (positionId: string, positionDoc?: Partial<PositionDocument>) => {
        if (!positionDoc) {
            inMemory.positions.delete(positionId)
            return true
        }
        const position = inMemory.positions.get(positionId) ?? {_id: positionId} as PositionDocument
        if (positionDoc.center) {
            position.center = positionDoc.center
        }
        if (positionDoc.zoomLevel) {
            position.zoomLevel = positionDoc.zoomLevel
        }
        position.timestamp = Date.now()
        inMemory.positions.set(
            positionId,
            position
        )
        return position
    }
}


const firstName = [
    '인정사정없는',
    '개인적인',
    '강인한',
    '우렁찬',
    '착한',
    '오지는',
    '풍성한',
]
const middleName = [
    '😁','😆','😍','😜', '🤣'
]
const lastName = [
    '흥부',
    '놀부',
    '콩쥐',
    '팥쥐',
    '토끼',
    '자라',
    '해님',
    '달님',
    '심청',
    '견우',
    '직녀',
    '장화',
    '홍련',
]
function getRandomName() {
    const i = randomInt(firstName.length)
    const j = randomInt(lastName.length)
    const o = randomInt(middleName.length)
    return firstName[i] + lastName[j] + middleName[o]
}

export default localDb