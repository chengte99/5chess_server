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

    redis_client.on("end", function(){

    })
}

/*
ugame_info = {
    uexp
    uchip
    uvip
}
*/
function set_ugame_info_inredis(uid, ugame_info){
    if(!redis_client){
        return;
    }

    var key = "bycw_ugame_user_uid_" + uid;
    ugame_info.uexp = ugame_info.uexp.toString();
    ugame_info.uchip = ugame_info.uchip.toString();
    ugame_info.uvip = ugame_info.uvip.toString();

    log.info("redis_client hmset " + key);

    redis_client.hmset(key, ugame_info, function(err){
        if(err){
            log.err(err);
        }
    });
}

/*
callback = function(status, ugame_info){}
*/
function get_ugame_info_inredis(uid, callback){
    if(!redis_client){
        callback(Response.SYS_ERROR, null);
        return;
    }

    var key = "bycw_ugame_user_uid_" + uid;
    log.info("redis_client hgetall " + key);

    redis_client.hgetall(key, function(err, data){
        if(err){
            log.error(err);
            callback(Response.SYS_ERROR, null);
            return;
        }

        var ugame_info = data;
        ugame_info.uexp = parseInt(ugame_info.uexp);
        ugame_info.uchip = parseInt(ugame_info.uchip);
        ugame_info.uvip = parseInt(ugame_info.uvip);

        callback(Response.OK, ugame_info);
    })
}

function add_ugame_info_uchip(uid, bonus, is_add){
    get_ugame_info_inredis(uid, function(status, ugame_info){
        if(status != Response.OK){
            log.warn("get_ugame_info_inredis fail, Response: ", status);
            return;
        }

        if(!is_add){
            bonus = -bonus;
        }

        ugame_info.uchip += bonus;
        
        set_ugame_info_inredis(uid, ugame_info);
    })
}

function update_world_rank_info(key_name, uid, uchip){
    redis_client.zadd(key_name, uchip, "" + uid);
}

function get_world_rank_info(key_name, num, callback){
    redis_client.zrevrange(key_name, 0, num, "withscores", function(err, data){
        if(err){
            log.error(err);
            callback(Response.SYS_ERROR, null);
            return;
        }

        callback(Response.OK, data);
    })
}

module.exports = {
    connect: connect_to_center,
    set_ugame_info_inredis: set_ugame_info_inredis,
    get_ugame_info_inredis: get_ugame_info_inredis,
    update_world_rank_info: update_world_rank_info,
    get_world_rank_info: get_world_rank_info,
    add_ugame_info_uchip: add_ugame_info_uchip,
}