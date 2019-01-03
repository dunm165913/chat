const express = require('express');
const app = express();
let server = require('http').Server(app);
let bodyParser = require('body-parser');
let auth = require('./auth');
let io = require('socket.io')(server);
let client = require('./clients');
let Conversation = require('./model/conversation');
let User = require('./model/user');
const bcrypt = require('bcryptjs');
let jwt = require('jsonwebtoken');


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(auth);
const mongoose = require('mongoose');
mongoose.connect("mongodb://du.nm165913:du20091998@ds255403.mlab.com:55403/chatserver", { useNewUrlParser: true });


app.get('/user', (req, res) => {
    res.render('user');
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
})
const api = require('./router/api');
app.use('/api', api);


io.on('connection', (socket) => {

    socket.on('send', (data) => {
        // console.log(data);
        Conversation.findById(data.id, (err, ok) => {
            //    console.log(ok);
            for (let i = 0; i < ok.id.length; i++) {
                for (let j = 0; j < client.length; j++) {
                    if (ok.id[i] == client[j].id_client) {
                        console.log("===" + client[j].id_socket + i)
                        io.to(client[j].id_socket).emit('recive', {
                            message: data.message,
                            id_send: data.id_send,
                            id_conversation: data.id
                        })

                    }
                }
            }
            Conversation.updateOne({
                _id:data.id
            },{
                $push:{
                    conversation:{
                        id:findSocketid(socket.id).id_client,
                        message:data.message
                    }
                }
            },(err,ok)=>{
                if(err) throw err;
            })


        })
    });

    socket.on('reloadpage',(data)=>{
        let user=findSocketid(socket.id);

        User.findById(user.id_client,(err,ok)=>{
            if(err) throw err;
            if(ok){
                console.log(ok.friend);
                ok.friend.map(x=>{
                    
                    for(let i=0;i<client.length;i++){
                        if(client[i].id_client==x.id_friend){
                    
                            io.to(client[i].id_socket).emit('friendonline',{
                                code:1000,
                                message:"on",
                                id:ok.id
                            })
                        }
                    }
                   
                })
            }
        })
    })
    socket.on('login', (data) => {

        if (data.password.length < 5 || data.username.length < 5) {
            io.to(socket.id).emit('resultlogin', {
                code: 9998,
                message: "loi"
            })
        }

        User.findOne({
            username: data.username,
        }, (err, ok) => {
            if (err) throw err;
            if (ok) {

                if (bcrypt.compareSync(data.password, ok.password)) {
                    let token = jwt.sign({
                        username: ok.username,
                        id: ok._id
                    },
                        "chatserver"
                        , {
                            expiresIn: '100h'
                        });

                    client.push({
                        id_client: ok._id,
                        id_socket: data.id_socket

                    })
                    let friend = [];
                    ok.friend.map(x => {
                        let flag = 0;
                        for (let u = 0; u < client.length; u++) {
                            if (client[u].id_client == x.id_friend) {
                                friend.push({
                                    friend: x,
                                    status: "on"
                                });
                                console.log(client[u].id_socket)
                                io.to(client[u].id_socket).emit('friendonline', {
                                    code: 1000,
                                    message: "on",
                                    id: ok._id
                                })
                                flag = 9;
                                break;
                            }
                        }
                        if (flag == 0) {
                            friend.push({
                                friend: x,
                                status: "off"
                            });
                        }
                    })
                    io.to(socket.id).emit('resultlogin', {
                        code: 1000,
                        token: token,
                        friend: friend,
                        message: "ok"
                    })


                }
                else {
                    io.to(socket.id).emit('resultlogin', {
                        code: 9997,
                        message: "Password sai"
                    })
                }
            }
            if (!ok) {
                io.to(socket.id).emit('resultlogin', {
                    code: 9994,
                    message: "Tai khoan khong ton tai"
                })
            }


        })
    });
    socket.on('logout', (data) => {
        let user = findSocketid(socket.id);
        console.log(user)
        if (user.id_client == null) {
            io.to(socket.id).emit('resultlogout', {
                code: 9992,
                message: "loi"
            })
        }
        else {
            client.splice(user.index, 1);
            console.log(client);

            User.findById(user.id_client, (err, ok) => {
                ok.friend.map(x => {
                    for (let u = 0; u < client.length; u++) {
                        if (client[u].id_client == x.id_friend) {

                            console.log(client[u].id_socket)
                            io.to(client[u].id_socket).emit('friendonline', {
                                code: 2000,
                                message: "off",
                                id: ok._id
                            })
                            flag = 9;
                            break;
                        }
                    }
                })
            })
            io.to(socket.id).emit('resultlogout', {
                code: 1000,
                message: "ok"
            })


        }
    })

   
    socket.on('disconnect', () => {


         console.log(socket.id+"000000----0000");

        let user = findSocketid(socket.id);
        // console.log(user)
        if (user.id_client == null) {
            // io.to(socket.id).emit('resultlogout', {
            //     code: 9992,
            //     message: "loi"
            // })
        }
        else {
            client.splice(user.index, 1);
           // console.log(client);

            User.findById(user.id_client, (err, ok) => {
                ok.friend.map(x => {
                    for (let u = 0; u < client.length; u++) {
                        if (client[u].id_client == x.id_friend) {

                            // console.log(client[u].id_socket)
                            io.to(client[u].id_socket).emit('friendonline', {
                                code: 2000,
                                message: "off",
                                id: ok._id
                            })
                            flag = 9;
                            break;
                        }
                    }
                })
            })
            // io.to(socket.id).emit('resultlogout', {
            //     code: 1000,
            //     message: "ok"
            // })


        }
    });
})


server.listen(process.env.PORT || 4000, () => {
    console.log("Server is listening on 3000");
})


function findSocketid(id) {
    console.log("........" + id);
    for (let i = 0; i < client.length; i++) {
        if (client[i].id_socket == id) {
            return {
                id_client: client[i].id_client,
                index: i
            }
        }

    }
    return {
        id_client: null,
        index: -1
    };
}
