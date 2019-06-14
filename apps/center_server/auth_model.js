var mysql_center = require("../../database/mysql_center");
var redis_center = require("../../database/redis_center");
var Response = require("../Response");
var utils = require("../../utils/utils");
var phone_msg = require("../phone_msg");

function guest_login_success(ukey, data, ret_func){
    var ret = {};
    ret.status = Response.OK;
    ret.uid = data.uid;
    ret.unick = data.unick;
    ret.usex = data.usex;
    ret.uface = data.uface;
    ret.uvip = data.uvip;
    ret.guest_key = ukey;

    redis_center.set_uinfo_inredis(data.uid, {
        unick: data.unick,
        usex: data.usex,
        uface: data.uface,
        uvip: data.uvip,
        is_guest: data.is_guest,
    });

    ret_func(ret);
}

function uname_login_success(data, ret_func){
    var ret = {};

    ret.status = Response.OK;
    ret.uid = data.uid;
    ret.unick = data.unick;
    ret.usex = data.usex;
    ret.uface = data.uface;
    ret.uvip = data.uvip;

    redis_center.set_uinfo_inredis(data.uid, {
        unick: data.unick,
        usex: data.usex,
        uface: data.uface,
        uvip: data.uvip,
        is_guest: data.is_guest,
    });

    ret_func(ret);
}

function write_err(status, ret_func){
    var ret = {};
    ret.status = status;
    ret_func(ret);
}

function guest_login_by_key(ukey, callback){
    mysql_center.get_uinfo_by_guest_key(ukey, function(status, sql_result){
        if(status != Response.OK){
            write_err(status, callback);
            return;
        }

        if(sql_result.length <= 0){
            // 查無資料，需註冊一筆
            var unick = "guest" + utils.random_int_str(6);
            mysql_center.add_uinfo_by_guest_key(unick, ukey, function(status, sql_result){
                if(status != Response.OK){
                    write_err(status, callback);
                    return;
                }

                guest_login_by_key(ukey, callback);
            });
        }else{
            // 有資料，返回資料
            var data = sql_result[0]
            if(!data.is_guest){
                write_err(Response.INVAILD_OPT, callback);
                return;
            }

            guest_login_success(ukey, data, callback);
        }
    });
}

function uname_login_by_uname_and_upwd(uname, upwd, callback){
    mysql_center.get_uinfo_by_uname_and_upwd(uname, upwd, function(status, sql_result){
        if(status != Response.OK){
            write_err(status, callback);
            return;
        }

        if(sql_result.length <= 0){
            //無資料
            write_err(Response.UNAME_OR_UPWD_ERR, callback);
            return;
        }else{
            // 有資料，返回資料
            var data = sql_result[0];

            uname_login_success(data, callback);
        }
    });
}

function user_edit_profile(uid, unick, usex, callback){
    var ret = {};
    mysql_center.edit_profile(uid, unick, usex, function(status){
        if(status != Response.OK){
            ret.status = status;
            callback(ret);
            return;
        }

        ret = {
            status: status,
            unick: unick,
            usex: usex
        };
        callback(ret);
    })
}

function _send_identify_code(phone, opt_type, callback){
    //執行之前 可以弄一個拉黑电话号码的表; 
    //id, number, status, 在获取短线前线做验证,这个电话是否被拉黑，
    //拉黑可以由程序来做条件，比如短信的操作次数，频率等，更具实际的工具来做决策
    //目前这里占不考虑

    var code = utils.random_int_str(6);
    mysql_center.update_phone_identify(phone, code, opt_type, function(status){
        if(status != Response.OK){
            callback(status);
            return;
        }

        // send phone code
        phone_msg.send_identify_code(phone, code);
        callback(status);
    });
}

function get_identify_code(uid, opt_type, phone, guest_key, callback){
    mysql_center.check_is_guest_by_uid(uid, function(status, sql_result){
        if(status != Response.OK){
            callback(status);
            return;
        }

        if(sql_result.length <= 0){
            callback(Response.INVAILD_OPT);
            return;
        }

        var data = sql_result[0];
        if (data.is_guest != 1){
            callback(Response.INVAILD_OPT);
            return;
        }
        
        _send_identify_code(phone, opt_type, callback);
    });
}

function get_verify_code_via_phone_reg(opt_type, phone, callback){
    mysql_center.check_phone_is_vaild(phone, function(status, sql_result){
        if(status != Response.OK){
            callback(status);
            return;
        }

        if(sql_result.length > 0){
            callback(Response.PHONE_IS_REGED);
            return;
        }

        _send_identify_code(phone, opt_type, callback);
    })
}

function get_verify_code_via_reset_pwd(opt_type, phone, callback){
    mysql_center.check_phone_is_vaild(phone, function(status, sql_result){
        if(status != Response.OK){
            callback(status);
            return;
        }

        if(sql_result.length <= 0){
            callback(Response.PHONE_IS_NO_REG);
            return;
        }

        _send_identify_code(phone, opt_type, callback);
    })
}

function _do_upgrade_account(uid, phone, pwd, code, callback){
    mysql_center.do_upgrade_account(uid, phone, pwd, function(status){
        // console.log("_do_upgrade_account");
        callback(status);
    })
}

function _do_reg_account(unick, phone, pwd, code, callback){
    var usex = utils.random_int(0, 1);

    mysql_center.do_reg_account(unick, phone, pwd, usex, function(status){
        // console.log("_do_upgrade_account");
        callback(status);
    })
}

function _do_reset_pwd(phone, pwd, callback){
    mysql_center.do_reset_pwd(phone, pwd, function(status){
        // console.log("_do_upgrade_account");
        callback(status);
    })
}

function _check_upgrade_acc_code_is_vaild(uid, phone, pwd, code, callback){
    mysql_center.check_code_is_vaild(phone, code, 0, function(status, sql_result){
        if(status != Response.OK){
            callback(status);
            return;
        }

        if(sql_result.length <= 0){
            callback(Response.INVAILD_OPT);
            return;
        }

        var data = sql_result[0];
        var now = utils.timestamp();
        if(now > data.endtime){
            callback(Response.CODE_IS_INVAILD);
            return;
        }

        _do_upgrade_account(uid, phone, pwd, code, callback);
    })
}

function _check_reg_phone_code_is_vaild(unick, phone, pwd, code, callback){
    mysql_center.check_code_is_vaild(phone, code, 1, function(status, sql_result){
        if(status != Response.OK){
            callback(status);
            return;
        }

        if(sql_result.length <= 0){
            callback(Response.INVAILD_OPT);
            return;
        }

        var data = sql_result[0];
        var now = utils.timestamp();
        if(now > data.endtime){
            callback(Response.CODE_IS_INVAILD);
            return;
        }

        _do_reg_account(unick, phone, pwd, code, callback);
    })
}

function _check_reset_pwd_code_is_vaild(phone, pwd, code, callback){
    mysql_center.check_code_is_vaild(phone, code, 2, function(status, sql_result){
        if(status != Response.OK){
            callback(status);
            return;
        }

        if(sql_result.length <= 0){
            callback(Response.INVAILD_OPT);
            return;
        }

        var data = sql_result[0];
        var now = utils.timestamp();
        if(now > data.endtime){
            callback(Response.CODE_IS_INVAILD);
            return;
        }

        _do_reset_pwd(phone, pwd, callback);
    })
}

function _check_phone_is_vaild(uid, phone, pwd, code, callback){
    mysql_center.check_phone_is_vaild(phone, function(status, sql_result){
        if(status != Response.OK){
            callback(status);
            return;
        }

        if(sql_result.length > 0){
            callback(Response.PHONE_IS_REGED);
            return;
        }

        _check_upgrade_acc_code_is_vaild(uid, phone, pwd, code, callback);
    })
}

function bind_phone_num_acc(uid, phone, pwd, code, callback){
    mysql_center.check_is_guest_by_uid(uid, function(status, sql_result){
        if(status != Response.OK){
            callback(status);
            return;
        }

        if(sql_result.length <= 0){
            callback(Response.INVAILD_OPT);
            return;
        }

        var data = sql_result[0];
        if (data.is_guest != 1){
            callback(Response.INVAILD_OPT);
            return;
        }
        
        _check_phone_is_vaild(uid, phone, pwd, code, callback);
    });
}

function reg_phone_acc(unick, phone, pwd, code, callback){
    mysql_center.check_phone_is_vaild(phone, function(status, sql_result){
        if(status != Response.OK){
            callback(status);
            return;
        }

        if(sql_result.length > 0){
            callback(Response.PHONE_IS_REGED);
            return;
        }

        _check_reg_phone_code_is_vaild(unick, phone, pwd, code, callback);
    })
}

function reset_pwd_acc(phone, pwd, code, callback){
    mysql_center.check_phone_is_vaild(phone, function(status, sql_result){
        if(status != Response.OK){
            callback(status);
            return;
        }

        if(sql_result.length <= 0){
            callback(Response.PHONE_IS_NO_REG);
            return;
        }

        _check_reset_pwd_code_is_vaild(phone, pwd, code, callback);
    })
}

module.exports = {
    guest_login_by_key: guest_login_by_key,
    uname_login_by_uname_and_upwd: uname_login_by_uname_and_upwd,
    user_edit_profile: user_edit_profile,
    get_identify_code: get_identify_code,
    bind_phone_num_acc: bind_phone_num_acc,
    get_verify_code_via_phone_reg: get_verify_code_via_phone_reg,
    reg_phone_acc: reg_phone_acc,
    get_verify_code_via_reset_pwd: get_verify_code_via_reset_pwd,
    reset_pwd_acc: reset_pwd_acc,
}