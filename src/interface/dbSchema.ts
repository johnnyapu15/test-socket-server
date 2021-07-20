export interface RoomDocument {
    _id: string
    userId: string
    createdDate: string
    startDate: string
    endDate: string
}

export interface UserDocument {
    _id: string
    nickname?: string
    roomId?: string
}
export interface Point {
    x: number
    y: number
}
export interface PositionDocument {
	_id: string      // position_{userId}_{roomId}
	userId: string
	roomId: string
	// center: LatLng
    center: Point
	zoomLevel: number
	timestamp: number       // 클라이언트에서 부드럽게 이동시키기 위한 수단.
}


export interface Db {
    rooms: Map<string, RoomDocument>
    users: Map<string, UserDocument>
    positions: Map<string, PositionDocument>
}