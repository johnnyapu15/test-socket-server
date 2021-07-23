var button = $('.button'),
    spinner = '<span class="spinner"></span>';

button.click(function() {
    if (!button.hasClass('loading')) {
        button.toggleClass('loading').html(spinner);
    } else {
        button.toggleClass('loading').html("Load");
    }
})


var cn;
//= document.getElementById('cw');
var c;
var u = 10;
const m = {
    x: innerWidth / 2,
    y: innerHeight / 2
};


function gc() {
    var s = "0123456789ABCDEF";
    var c = "#";
    for (var i = 0; i < 6; i++) {
        c += s[Math.ceil(Math.random() * 15)]
    }
    return c
}
var a = new Map();
window.onload = function myfunction() {
    cn = document.getElementById('cw');
    c = cn.getContext('2d');


    //cn.style.backgroundColor = "#700bc8";

    c.lineWidth = "2";
    c.globalAlpha = 0.5;
    resize();
    anim()
}
window.onresize = function() {

    resize();

}

function resize() {
    cn.height = innerHeight;
    cn.width = innerWidth;
    // for (var i = 0; i < 10; i++) {
    //     var r = 30;
    //     var x = Math.random() * (innerWidth - 2 * r) + r;
    //     var y = Math.random() * (innerHeight - 2 * r) + r;
    //     a[i] = new ob(innerWidth / 2, innerHeight / 2, 4, gc(), Math.random() * 200 + 20, 0.02, m);

    // }
    //  a[0] = new ob(innerWidth / 2, innerHeight / 2, 40, "red", 0.05, 0.05);
    //a[0].dr();
}

function ob(x, y, r, cc, o, s, id) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.cc = cc;
    this.theta = Math.random() * Math.PI * 2;
    this.s = s;
    this.o = o;
    this.t = Math.random() * 40;

    this.o = o;
    this.dr = function() {
        const ls = {
            x: this.x,
            y: this.y
        };
        this.theta += this.s;
        this.x = data.positions.get(id).center.x + Math.cos(this.theta) * this.t;
        this.y = data.positions.get(id).center.y + Math.sin(this.theta) * this.t;
        c.beginPath();
        c.lineWidth = this.r;
        c.strokeStyle = this.cc;
        c.moveTo(ls.x, ls.y);
        c.lineTo(this.x, this.y);
        c.stroke();
        c.closePath();
    }

    this.resize = () => {

    }
}

function anim() {
    requestAnimationFrame(anim);
    c.fillStyle = "rgba(0,0,0,0.05)";
    c.fillRect(0, 0, cn.width, cn.height);
    a.forEach(function(aa, k, _) {
        aa.forEach((e, i) => {
            e.dr();
        })
    });

}

function createPoint(p) {
    for (var i = 0; i < 10; i++) {
        var r = 30;
        var x = Math.random() * (innerWidth - 2 * r) + r;
        var y = Math.random() * (innerHeight - 2 * r) + r;
        var t = new ob(innerWidth / 2, innerHeight / 2, 5, "red", Math.random() * 200 + 20, 2, p);
        if (!a.has(p)) {
            a.set(p, [])
        }
        a.get(p).push(t);
    }
}

const data = { rooms: new Map(), positions: new Map(), users: new Map() }
const user = initMember('test', data, undefined, true)
user.user.on('update', got => {
    if (!data.users.has(got.id)) {
        // new user
        createPoint(got.id)
    }
    if (!got.user) {
        // delete user
        a.delete(got.id)
    }
})
user.position.on('update', got => {

})

window.onmousemove = function(e) {
    user.position.emit('update', { center: { x: e.clientX, y: e.clientY } }, () => {})
}


function disconnect(objs) {
    objs.forEach(v => {
        v.room.disconnect()
        v.user.disconnect()
        v.position.disconnect()
    })
}

function merge(map, id, newObj) {
    // 기존 오브젝트와 병합하거나, 삭제한다.
    if (!newObj) {
        map.delete(id)
    } else {
        const preObj = map.get(id)

        if (preObj) {
            map.set(id, {...preObj, ...newObj })
        } else {
            map.set(id, newObj)
        }
    }
}

function logging(prefix, msg, print) {
    if (print) {
        console.log(`FROM:${prefix.substr(0,5)} ${msg}`)
    }
}

function initMember(roomId, data, done, isPrint) {
    const port = 3000
    const url = `ws://curatesome.com:${port}`
    const opts = {
        transports: ['websocket'],
        autoConnect: false,
        forceNew: true,
        query: {}
    }

    var roomSocket, userSocket, positionSocket
    const errorHandler = (err) => { logging('error', `${JSON.stringify(err)}`, isPrint) }
    const printCb = (val) => { logging('callback', `${JSON.stringify(val)}`, isPrint) }
    userSocket = io(`${url}/user`, opts)
    positionSocket = io(`${url}/position`, opts)
    roomSocket = io(`${url}/room`, opts)
        .on('error', errorHandler)
        .on("connect", () => {
            const id = roomSocket.id // room socket의 id를 클라이언트의 id로 활용
            logging(id, `1. [connect] room socket. my unique id = ${id}`, isPrint)

            // 'first, connects user, position socket'
            opts.query = { id }
                // user socket init
            var userSocketJoinCallback = async() => {}
            userSocket.connect()
                .on('error', errorHandler)
                .on('connect', () => {
                    logging(id, '2. [connect] user socket', isPrint)
                })
                .on('me', me => {
                    merge(data.users, id, me)
                })
                .on('update', got => {
                    if (!got.user) {
                        logging(id, `user left: ${got.id}`, isPrint)
                    }
                    merge(data.users, got.id, got.user)
                })
                // position socket init
            var positionSocketJoinCallback = async() => {}
            positionSocket.connect()
                .on('error', errorHandler)
                .on('connect', () => {
                    logging(id, '2. [connect] position socket', isPrint)
                })
                .on('update', got => {
                    logging(id, `#. [position-update] ${JSON.stringify(got.position)}`, isPrint)
                    merge(data.positions, got.id, got.position)
                })

            // lets create or join room
            roomSocket.emit('get', roomId, (cb) => {
                if (cb.room) {
                    // room is created already
                    logging(id, '2. the room created already. lets join!', isPrint)
                } else {
                    // we can create the room
                    roomSocket.emit('create', roomId, cb => {
                        if (cb.error) {
                            // error?
                            console.error(`errror when creating the room, msg: ${cb}`)
                            if (done) done()
                            return
                        } else {
                            logging(id, `2. created room: ${JSON.stringify(cb.room)}`, isPrint)
                        }
                    })
                }
                // so there is the room. lets join.
                roomSocket.emit('join', roomId, cb => {
                    if (cb.error) {
                        logging(id, cb.error, isPrint)
                        if (done) done()
                        return
                    } else {
                        logging(id, `2. joined to room: ${JSON.stringify(cb.room)}`, isPrint)
                        merge(data.rooms, cb.id, cb.room)
                    }
                    // if successfully joined to the room, manage other sockets.
                    // user socket
                    userSocket.emit('join', roomId, userSocketJoinCallback)
                    userSocket.emit('init', roomId)

                    // position socket
                    positionSocket.emit('join', roomId, positionSocketJoinCallback)

                    if (done) done()
                })
            })
        });
    roomSocket.connect()
    return { room: roomSocket, user: userSocket, position: positionSocket }
}