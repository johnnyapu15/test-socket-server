import {Db as MongoDb, MongoClient, MongoDBNamespace} from 'mongodb'
import { Db, UserDocument, RoomDocument } from "../interface/dbSchema";

const url = 'mongodb://localhost:27017'
const dbName = 'test'

const collections = {
    user: 'user',
    room: 'room',
    position:'position',
}

async function getDb() {
    const client = new MongoClient(url)
    await client.connect()
    return client.db(dbName)
}

async function getCollection<T>(client: MongoDb, collection: string) {
    return client.collection<T>(collection)
}

export async function createRoom() {
    const client = getDb()
    
}

export async function createUser(user: UserDocument) {
    const client = await getDb()
    const userCollection = await getCollection<UserDocument>(client, collections.user)
    userCollection.insertOne(user)
}

export async function checkNicknameUnique(nickname: string, roomId: string) {
    const client = await getDb()

    const userCollection = await getCollection<UserDocument>(client, collections.user)
    const user = await userCollection.findOne({roomId, nickname})
    
    return {isUnique: (!user)}
}