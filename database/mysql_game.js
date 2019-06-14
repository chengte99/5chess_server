var mysql = require("mysql");
var util = require('util');
var Response = require("../apps/Response");
var log = require("../utils/log");
var utils = require("../utils/utils");

var conn_pool = null;
function connect_to_server(host, port, db_name, user, password){
    conn_pool = mysql.createPool({
        host: host,
        port: port,
        database: db_name,
        user: user,
        password: password
    });
}

function mysql_exec(sql, callback) {
	conn_pool.getConnection(function(err, conn) {
		if (err) {
			if(callback) {
				callback(err, null, null);
			}
			return;
        }
        
		conn.query(sql, function(sql_err, sql_result, fields_desic) {
            conn.release();

			if (sql_err) {
				if (callback) {
					callback(sql_err, null, null);
				}
				return;
            }
            
			if (callback) {
				callback(null, sql_result, fields_desic);
			}
		});
	});
}

function get_game_info_by_uid(uid, callback){
    var sql = "select * from ugame where uid = %d limit 1";
    var sql_cmd = util.format(sql, uid);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR, null);
            return;
        }

        callback(Response.OK, sql_result);
    })
}

function check_user_login_bonus(uid, callback){
    var sql = "select * from login_bonus where uid = %d limit 1";
    var sql_cmd = util.format(sql, uid);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR, null);
            return;
        }

        callback(Response.OK, sql_result);
    })
}

function insert_game_info(uid, uexp, uchip, callback){
    var sql = "insert into ugame (`uid`, `uexp`, `uchip`) values (%d, %d, %d)";
    var sql_cmd = util.format(sql, uid, uexp, uchip);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR);
            return;
        }

        callback(Response.OK);
    })
}

function insert_user_login_bonus(uid, bonus, callback){
    var now = utils.timestamp();
    var sql = "insert into login_bonus (`uid`, `bonus`, `bonus_time`, `days`) values (%d, %d, %d, %d)";
    var sql_cmd = util.format(sql, uid, bonus, now, 1);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR);
            return;
        }

        callback(Response.OK);
    })
}

function update_user_login_bonus(uid, bonus, days, callback){
    var now = utils.timestamp();
    var sql = "update login_bonus set bonus = %d, days = %d, bonus_time = %d, status = 0 where uid = %d";
    var sql_cmd = util.format(sql, bonus, days, now, uid);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR);
            return;
        }

        callback(Response.OK);
    })
}

function update_login_bonus(id, callback){
    var sql = "update login_bonus set status = 1 where id = %d";
    var sql_cmd = util.format(sql, id);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR);
            return;
        }

        callback(Response.OK);
    })
}

function update_game_info_uchip_by_uid(uid, bonus, is_add, callback){
    if(!is_add){
        bonus = -bonus;
    }
    var sql = "update ugame set uchip = uchip + %d where uid = %d";
    var sql_cmd = util.format(sql, bonus, uid);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR);
            return;
        }

        callback(Response.OK);
    })
}

module.exports = {
    connect: connect_to_server,
    get_game_info_by_uid: get_game_info_by_uid,
    insert_game_info: insert_game_info,

    check_user_login_bonus: check_user_login_bonus,
    insert_user_login_bonus: insert_user_login_bonus,
    update_user_login_bonus: update_user_login_bonus,

    update_login_bonus: update_login_bonus,
    update_game_info_uchip_by_uid: update_game_info_uchip_by_uid
}