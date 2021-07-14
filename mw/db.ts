// 다른 redis 모듈을 쓰는걸로.
import {AsyncRedis, CrudCommands} from 'async-redis'
import {ClientOpts} from 'redis'

const clientOptions: ClientOpts = {
    host: 'localhost',
    port: 6379,
}
const db = new AsyncRedis(clientOptions)


export async function get(key:string) {
    const client = db.createClient();
    return await client.get('qwe');
}