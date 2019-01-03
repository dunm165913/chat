const bcrypt = require('bcryptjs');
let jwt = require('jsonwebtoken');
let User = require('../model/user');
let express = require('express');
let router = express.Router();
let io = require('../server');
let client = require('../clients');
let Conversation = require('../model/conversation');


router.route('/signup').post((req, res) => {
    let data = req.body;
    if (data.password.length < 5 || data.username.length < 5) {
        res.json({
            code: 9998,
            message: "Du lieu khong hop le"
        });
        return false;
    }
    User.findOne({
        username: data.username
    }, (err, ok) => {
        if (err) throw err;
        if (ok) {
            res.json({
                code: 9997,
                message: "Username da ton tai"
            })
        }
        if (!ok) {
            let user = new User();
            user.username = data.username;

            user.password = bcrypt.hashSync(data.password);

            user.save();
            res.json({
                code: 1000,
                message: "ok"
            });
            return true;

        }
    })

});


//
// router.route('/login').post((req, res) => {
//     let data = req.body;
//     if (data.password.length < 5 || data.username.length < 5) {
//         res.json({
//             code: 9998,
//             message: "Du lieu khong hop le"
//         });
//         return false;
//     }
//     if (!req.userData) {
//         User.findOne({
//             username: data.username,
//         }, (err, ok) => {
//             if (err) throw err;
//             if (ok) {

//                 if (bcrypt.compareSync(data.password, ok.password)) {


//                     let token = jwt.sign({
//                         username: ok.username,
//                         id: ok._id
//                     },
//                         "chatserver"
//                         , {
//                             expiresIn: '100h'
//                         });

//                     client.push({
//                         id_client: ok._id,
//                         id_socket: req.body.id_socket

//                     })
//                     let friend = [];
//                     ok.friend.map(x => {
//                         let flag = 0;
//                         for (let u = 0; u < client.length; u++) {
//                             if (client[u].id_client == x.id_friend) {
//                                 friend.push({
//                                     friend: x,
//                                     status: "on"
//                                 });
//                                 flag = 9;
//                                 break;
//                             }
//                         }
//                         if (flag == 0) {
//                             friend.push({
//                                 friend: x,
//                                 status: "off"
//                             });
//                         }
//                     })

//                     res.json({
//                         code: 1000,
//                         message: "ok",
//                         token: token,
//                         friend: friend
//                     })
//                 }
//                 else {
//                     res.json({

//                         code: 9996,
//                         message: "Password sai"

//                     })
//                 }
//             }
//             if (!ok) {
//                 res.json({
//                     code: 9997,
//                     message: "Khong tim thay nguoi dung"
//                 })
//             }

//         })
//     }
//     else {
//         res.json({
//             code: 9993,
//             message: "You are online"
//         })
//     }
// })

// router.route('/logout').post((req, res) => {
//     if (!req.userData) {
//         res.json({
//             code: 9998,
//             message: "No token"
//         })
//     }
//     else {
//         let i;
//         for (i = 0; i < client.length; i++) {
//             if (client[i].id_client == req.userData.id)
//                 break;

//         }
//         client.splice(i, 1);
//         res.json({
//             code: 1000,
//             message: "ok"
//         })
//     }

// })
router.route('/changesocketid').post((req, res) => {
    console.log(req.body.id_socket + "--------");

    if (!req.userData) {
        res.json({
            code: 9991,
            message: "token is not validate"
        })
    }
    else {
        client.push({
            id_client: req.userData.id,
            id_socket: req.body.id_socket
        })
        console.log(client)
        User.findOne({
            username: req.userData.username
        }, (err, ok) => {
            if (err) throw err;

            //filter friend online
            let friend = [];
            ok.friend.map(x => {
                let flag = 0;
                for (let u = 0; u < client.length; u++) {
                    if (client[u].id_client == x.id_friend) {
                        friend.push({
                            friend: x,
                            status: "on"
                        });
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

            res.json({
                code: 1000,
                message: "ok",
                id: ok._id,
                friend: friend
            })
        })


    }
})

router.route('/search').post((req, res) => {
    console.log(req.body);
    let reg = new RegExp(req.body.search);
    if (req.body.search.length == 0) {
        res.json({
            code: 9993,
            message: "Unknow"
        })
    } else {
        User.find((err, ok) => {
            if (err) throw err;
            let friend = [];
            ok.map(x => {
                // console.log(x);
                if (reg.test(x.username)) {
                    friend.push({
                        id: x._id,
                        username: x.username
                    })
                }
            });
            if (friend.length == 0) {
                res.json({
                    code: 9994,
                    message: "Not found"
                })
            } else {
                res.json({
                    code: 1000,
                    friend: friend
                })
            }
        })
    }
})

router.route('/makecon').post((req, res) => {
    console.log(req.body)
    if (!req.userData || req.body.id_friend.length == 0) {
        res.json({
            code: 9999,
            message: "Unknow"
        })
    } else {
        console.log(req.body);
        let con = new Conversation();
        con.id = [req.body.id_friend, req.userData.id];
        con.conversation = [];
        con.save((err, ok) => {
            if (err) throw err;
            User.findByIdAndUpdate(req.body.id_friend, {
                $push: {
                    friend: {
                        id_friend: req.userData.id,
                        username: req.userData.username,
                        id_conversation: ok._id
                    }
                }
            }, (err, ok1) => {
                if (err) throw err;
                User.findByIdAndUpdate(req.userData.id, {
                    $push: {
                        friend: {
                            id_friend: req.body.id_friend,
                            username: req.body.username,
                            id_conversation: ok._id

                        }
                    }
                }, (err, okr) => {
                    if (err) throw err;
                    res.json({
                        code: 1000,
                        message: "ok",
                        id_conversation: ok._id
                    })
                })
            })
        });
    }
})

router.route('/user').post((req, res) => {
    if (!req.userData) {
        console.log(req.userData);
        res.json({
            code: 9999,
            message: "Errol"
        })

    }
    else {
        User.findOne({
            username: req.userData.userData
        }, (err, ok) => {
            if (err) throw err;
            if (ok) {
                res.json({
                    code: 1000,
                    message: "ok"
                })
            }
            if (!ok) {
                res.json({
                    code: 9991,
                    message: "User not exc"
                })
            }
        }
        )
    }
})

router.route('/conversation').post((req, res) => {
    console.log(req.body.id);
    Conversation.findOne({
        _id: req.body.id
    }, (err, ok) => {
        if (err) throw err
        console.log(ok);
        res.json({
            code: 1000,
            message: "ok",
            conversation: ok.conversation
        })
    })
})


function xoadau(str) {
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");


    return str;
}

module.exports = router;