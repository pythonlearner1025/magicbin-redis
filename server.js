const Redis = require('ioredis');
const {ethers} = require('ethers');
const blockchainProvider = "";
const blockchainPort = 0x000;
const expressPort = 3000;
const redisPort = 6379;

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

    const userName = req.body.userName;
    const userPubKey = req.body.pubKey;

    const checkHash = req.body.hash;
    const hashRegistered = await isHashRegistered(checkHash); 
    if (hashRegistered){
        redis.sadd("users", userName)
        redis.hset(userName, "pubkey", userPubKey, "shares", 1);
        res.status(200).json({"success": true});
    } else {
        res.status(200).json({"success": false});
    }
});


app.post("/register/user", async function(req,res){
    console.log("***************************************************");
    console.log("/register/newuser");

    const checkHash = req.body.hash;
    const userName = req.body.userName;
    const hashRegistered = await isHashRegistered(checkHash); 
    const userRegistered = await isUserRegistered(userName); 
    if (hashRegistered && userRegistered){
        redis.srem("hashes", checkHash);
        redis.hincrby(userName, "shares", 1);
        res.status(200).json({"success": true});
    } else {
        res.status(200).json({"success": false});
    }
});

app.post("/commit", async function(req,res){
    console.log("***************************************************");
    console.log("/register/newuser");

    const ps = req.body.ps;
    if (ps == "xyz"){

        // caclulate percentages based on shares of users
        // get all users + get all their associated hashes

    }

})

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

app.listen(expressPort, ()=>{
    console.log("listening on port... ", expressPort);
})