var redis = require("redis");
var util = require('util');
var Response = require("../apps/Response");
var log = require("../utils/log");
var utils = require("../utils/utils");

var redis_client = null;

function connect_to_center(host, port, db_index){
    redis_client = redis.createClient({
        host: host,
        port: port,
        db: db_index,
    });

    redis_client.on("error", function(err){
        log.error(err);
    });
}

/*
uinfo = {
    unick
    usex
    uface
    uvip
    is_guest
}
*/
function set_uinfo_inredis(uid, uinfo){
    if(!redis_client){
        return;
    }

    var key = "bycw_center_user_uid_" + uid;
    uinfo.usex = uinfo.usex.toString();
    uinfo.uface = uinfo.uface.toString();
    uinfo.uvip = uinfo.uvip.toString();
    uinfo.is_guest = uinfo.is_guest.toString();

    log.info("redis_client hmset " + key);

    redis_client.hmset(key, uinfo, function(err){
        if(err){
            log.err(err);
        }
    });
}

/*
callback = function(status, uinfo){}
*/
function get_uinfo_inredis(uid, callback){
    if(!redis_client){
        callback(Response.SYS_ERROR, null);
        return;
    }

    var key = "bycw_center_user_uid_" + uid;
    log.info("redis_client hgetall " + key);

    redis_client.hgetall(key, function(err, data){
        if(err){
            log.error(err);
            callback(Response.SYS_ERROR, null);
            return;
        }

        var uinfo = data;
        uinfo.usex = parseInt(uinfo.usex);
        uinfo.uface = parseInt(uinfo.uface);
        uinfo.uvip = parseInt(uinfo.uvip);
        uinfo.is_guest = parseInt(uinfo.is_guest);

        callback(Response.OK, uinfo);
    })
}

module.exports = {
    connect: connect_to_center,
    set_uinfo_inredis: set_uinfo_inredis,
    get_uinfo_inredis: get_uinfo_inredis,
}