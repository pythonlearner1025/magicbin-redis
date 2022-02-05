const Redis = require('ioredis');
const crypto = require('crypto');
const {ethers} = require('ethers');
const fs = require('fs');

const blockchainProvider = "";
const blockchainPort = 0x000;
const expressPort = 3000;
const redisPort = 6379;
const pubKeyFile = "./crypto/public.pem"


const redis = new Redis(redisPort);
var express = require('express');
var app = express();
var cors = require('cors');

app.use(cors());
app.use(express.json());

// receive hash sent when correctly recycled
// receive from local 
// record to redis
app.post("/register/newtrash", async function(req,res){
    console.log("**************************************************");
    console.log("/register/newtrash");
    const newHash = req.body.hash;
    redis.sadd("hashes", newHash);
    res.status(200).send("registered new trash");
});

// FIRST TIME REGISTERING
// receive user-inputted has from website

/*
    register user to redis database
    set user share to 1 
*/

app.post("/register/newuser", async function(req,res){
    console.log("***************************************************");
    console.log("/register/newuser");

    const data = req.body.data;
    const sig = req.body.sig;
    console.log(req.body)
   
    const authentic = isVerified(sig, data);
    console.log('authentic', authentic)

    const userName = data.userName;
    const userPubKey = data.pubKey;
    const checkHash = data.hash;
    console.log('username',userName)
    console.log('checkhash',checkHash)

    const hashRegistered = await isHashRegistered(checkHash); 
    console.log('hashRegistered', hashRegistered)

    if (authentic && hashRegistered){
        // remove hash
        redis.srem("hashes", checkHash)

        // add users to registered users, and set shares to 1
        redis.sadd("users", userName)
        redis.hset(userName, "pubkey", userPubKey, "shares", 1);
        res.status(200).json({"success": true});
    } else {
        res.status(200).json({"success": false});
    }
});


app.post("/register/user", async function(req,res){
    console.log("***************************************************");
    console.log("/register/user");

    const data = req.body.data;
    const sig = req.body.sig;
    console.log(req.body)

    const authentic = isVerified(sig, data)
    console.log('authentic', authentic)

    const checkHash = data.hash;
    const userName = data.userName;
    console.log('username',userName)
    console.log('checkhash',checkHash)

    const hashRegistered = await isHashRegistered(checkHash); 
    const userRegistered = await isUserRegistered(userName); 
    console.log('hashRegistered', hashRegistered)
    console.log('userRegistered', userRegistered)

    if (authentic && hashRegistered && userRegistered){
        // remove hash
        redis.srem("hashes", checkHash);
        
        // inc shares by 1
        redis.hincrby(userName, "shares", 1);
        res.status(200).json({"success": true});
    } else {
        res.status(200).json({"success": false});
    }
});



app.post("/commit", async function(req,res){
    console.log("***************************************************");
    console.log("/commit");

    const ps = req.body.ps;
    if (ps == "xyz"){

        // caclulate percentages based on shares of users
        // get all users + get all their associated hashes
        const selection = []
        const users = await redis.smembers("users");
        for (let i=0;i<users.length;i++){
            let thisUser = users[i];
            let userInfo = await redis.hgetall(thisUser, 'pubkey', 'shares');
            let userPubKey = userInfo[0]
            let userShares = userInfo[1]
            if (userShares > 1){
                for (let j=0; j<userShares; j++){
                    selection.push(userPubKey)
                }
            } else {
                selection.push(userPubKey)
            }

            print(selection)
        }

        print(selection)

        const randInt = getRandomInt(selection.length);
        const winner = selection[randInt]

        // pay the winner

        
    }

})

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

// return info about number of users
app.get("/get/information", async function(req,res){
    console.log("***************************************************");
    console.log("/get/information");

    const users = await redis.smembers('users');
    res.status(200).json({"users": users});
})

async function isHashRegistered(hash){
    return await redis.sismember("hashes", hash);
}

async function isUserRegistered(user){
    return await redis.sismember("users", user);
}

function isVerified(signature, data){
    const data_string = JSON.stringify(data)
    const pubKey = fs.readFileSync(pubKeyFile);
    const truth = crypto.verify(
        "sha256",
        Buffer.from(data_string),
        {
            key:pubKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING
        },
        Buffer.from(signature,'base64')
    )
    return truth;
}

app.listen(expressPort, ()=>{
    console.log("listening on port... ", expressPort);
})

