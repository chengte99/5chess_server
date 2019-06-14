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

function get_uinfo_by_guest_key(key, callback){
    var sql = "select * from uinfo where guest_key = \"%s\" and status = 0"
    var sql_cmd = util.format(sql, key);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR, null);
            return;
        }

        callback(Response.OK, sql_result);
    });
}

function get_uinfo_by_uname_and_upwd(uname, upwd, callback){
    var sql = "select * from uinfo where uname = \"%s\" and upwd = \"%s\" and status = 0 limit 1"
    var sql_cmd = util.format(sql, uname, upwd);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR, null);
            return;
        }

        callback(Response.OK, sql_result);
    });
}

function add_uinfo_by_guest_key(unick, key, callback){
    var sql = "insert into uinfo (`unick`, `guest_key`) values (\"%s\", \"%s\")";
    var sql_cmd = util.format(sql, unick, key);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR, null);
            return;
        }

        callback(Response.OK, sql_result);
    });
}

function edit_profile(uid, unick, usex, callback){
    var sql = "update uinfo set unick = \"%s\", usex = %d where uid = %d";
    var sql_cmd = util.format(sql, unick, usex, uid);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR);
            return;
        }

        callback(Response.OK);
    });
}

function check_is_guest_by_uid(uid, callback){
    var sql = "select * from uinfo where uid = %d and status = 0"
    var sql_cmd = util.format(sql, uid);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR, null);
            return;
        }

        callback(Response.OK, sql_result);
    });
}

function _check_phone_identify_exist(phone, opt_type, callback){
    var sql = "select * from phone_chat where phone = \"%s\" and opt_type = %d"
    var sql_cmd= util.format(sql, phone, opt_type);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR, null);
            return;
        }

        callback(Response.OK, sql_result);
    })
}

function _insert_phone_chat(phone, code, opt_type, endtime, callback){
    var sql = "insert into phone_chat (`phone`, `code`, `opt_type`, `endtime`, `count`) values (\"%s\", \"%s\", %d, %d, 1)";
    var sql_cmd = util.format(sql, phone, code, opt_type, endtime);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR);
            return;
        }

        callback(Response.OK);
    })
}

function _update_phone_chat(phone, code, opt_type, endtime, callback){
    var sql = "update phone_chat set code = \"%s\", endtime = %d, count = count+1 where phone = \"%s\" and opt_type = %d";
    var sql_cmd = util.format(sql, code, endtime, phone, opt_type);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR);
            return;
        }

        callback(Response.OK);
    })
}

function update_phone_identify(phone, code, opt_type, callback){
    _check_phone_identify_exist(phone, opt_type, function(status, sql_result){
        if(status != Response.OK){
            callback(status);
        }else{
            var endtime = utils.timestamp() + 60;
            if(sql_result.length <= 0){
                //insert
                _insert_phone_chat(phone, code, opt_type, endtime, function(status){
                    callback(status);
                })
            }else{
                //update
                _update_phone_chat(phone, code, opt_type, endtime, function(status){
                    callback(status);
                })
            }
        }
    });
}

function check_phone_is_vaild(phone, callback){
    var sql = "select uid from uinfo where uname = \"%s\" limit 1";
    var sql_cmd = util.format(sql, phone);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR, null);
            return;
        }

        callback(Response.OK, sql_result);
    })
}

function check_code_is_vaild(phone, code, opt_type, callback){
    var sql = "select * from phone_chat where phone = \"%s\" and code = \"%s\" and opt_type = %d";
    var sql_cmd = util.format(sql, phone, code, opt_type);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR, null);
            return;
        }

        callback(Response.OK, sql_result);
    })
}

function do_upgrade_account(uid, phone, pwd, callback){
    var sql = "update uinfo set uname = \"%s\", upwd = \"%s\", uphone = \"%s\", is_guest = 0 where uid = %d";
    var sql_cmd = util.format(sql, phone, pwd, phone, uid);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR);
            return;
        }

        callback(Response.OK);
    })
}

function do_reg_account(unick, phone, pwd, usex, callback){
    var sql = "insert into uinfo (`unick`, `uname`, `upwd`, `usex`, `is_guest`) values (\"%s\", \"%s\", \"%s\", %d, 0)";
    var sql_cmd = util.format(sql, unick, phone, pwd, usex);
    log.info(sql_cmd);

    mysql_exec(sql_cmd, function(err, sql_result, fields_desic){
        if(err){
            callback(Response.SYS_ERROR);
            return;
        }

        callback(Response.OK);
    })
}

function do_reset_pwd(phone, pwd, callback){
    var sql = "update uinfo set upwd = \"%s\" where uname = \"%s\"";
    var sql_cmd = util.format(sql, pwd, phone);
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
    get_uinfo_by_guest_key: get_uinfo_by_guest_key,
    get_uinfo_by_uname_and_upwd: get_uinfo_by_uname_and_upwd,
    add_uinfo_by_guest_key: add_uinfo_by_guest_key,
    edit_profile: edit_profile,
    check_is_guest_by_uid: check_is_guest_by_uid,
    update_phone_identify: update_phone_identify,
    check_phone_is_vaild: check_phone_is_vaild,
    check_code_is_vaild: check_code_is_vaild,
    do_upgrade_account: do_upgrade_account,
    do_reg_account: do_reg_account,
    do_reset_pwd: do_reset_pwd,
}