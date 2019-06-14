var log = require("../../utils/log");
var Stype = require("../Stype");
var Cmd = require("../Cmd");
var Response = require("../Response");
var auth_model = require("./auth_model");
require("./auth_proto");

function guest_login(session, stype, ctype, body, utag, proto_type){
    if(!body){
        session.send_cmd(stype, ctype, Response.INVAILD_PARAMS, utag, proto_type);
        return;
    }

    auth_model.guest_login_by_key(body, function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

function uname_login(session, stype, ctype, body, utag, proto_type){
    if(!body || !body[0] || !body[1]){
        session.send_cmd(stype, ctype, Response.INVAILD_PARAMS, utag, proto_type);
        return;
    }

    auth_model.uname_login_by_uname_and_upwd(body[0], body[1], function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

function edit_profile(session, stype, ctype, body, utag, proto_type){
    if(!body || !body.unick || (body.usex != 0 && body.usex != 1)){
        session.send_cmd(stype, ctype, Response.INVAILD_PARAMS, utag, proto_type);
        return;
    }

    auth_model.user_edit_profile(utag, body.unick, body.usex, function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

function guest_upgrade_identify_code(session, stype, ctype, body, utag, proto_type){
    if(!body || body[0] != 0 || !body[1] || !body[2]){
        session.send_cmd(stype, ctype, Response.INVAILD_PARAMS, utag, proto_type);
        return;
    }

    auth_model.get_identify_code(utag, body[0], body[1], body[2], function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

function phone_reg_identify_code(session, stype, ctype, body, utag, proto_type){
    if(!body || !body[0] || !body[1]){
        session.send_cmd(stype, ctype, Response.INVAILD_PARAMS, utag, proto_type);
        return;
    }

    auth_model.get_verify_code_via_phone_reg(body[0], body[1], function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

function reset_pwd_identify_code(session, stype, ctype, body, utag, proto_type){
    if(!body || !body[0] || !body[1]){
        session.send_cmd(stype, ctype, Response.INVAILD_PARAMS, utag, proto_type);
        return;
    }

    auth_model.get_verify_code_via_reset_pwd(body[0], body[1], function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

function bind_phone_num_acc(session, stype, ctype, body, utag, proto_type){
    if(!body || !body[0] || !body[1] || !body[2]){
        session.send_cmd(stype, ctype, Response.INVAILD_PARAMS, utag, proto_type);
        return;
    }

    auth_model.bind_phone_num_acc(utag, body[0], body[1], body[2], function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

function reg_phone_acc(session, stype, ctype, body, utag, proto_type){
    if(!body || !body[0] || !body[1] || !body[2] || !body[3]){
        session.send_cmd(stype, ctype, Response.INVAILD_PARAMS, utag, proto_type);
        return;
    }

    auth_model.reg_phone_acc(body[3], body[0], body[1], body[2], function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

function reset_pwd_acc(session, stype, ctype, body, utag, proto_type){
    if(!body || !body[0] || !body[1] || !body[2]){
        session.send_cmd(stype, ctype, Response.INVAILD_PARAMS, utag, proto_type);
        return;
    }

    auth_model.reset_pwd_acc(body[0], body[1], body[2], function(ret){
        session.send_cmd(stype, ctype, ret, utag, proto_type);
    });
}

var service = {
    name: "auth_service",
    is_transfer: false,

    on_player_recv_cmd: function(session, stype, ctype, body, utag, proto_type, raw_cmd){
        log.info(stype, ctype, body);
        switch (ctype) {
            case Cmd.Auth.GUEST_LOGIN:
                guest_login(session, stype, ctype, body, utag, proto_type);
                break;
            case Cmd.Auth.EDIT_PROFILE:
                edit_profile(session, stype, ctype, body, utag, proto_type);
                break;
            case Cmd.Auth.GET_VERIFY_VIA_UPGRADE:
                guest_upgrade_identify_code(session, stype, ctype, body, utag, proto_type);
                break;
            case Cmd.Auth.BIND_PHONE_NUM:
                bind_phone_num_acc(session, stype, ctype, body, utag, proto_type);
                break;
            case Cmd.Auth.UNAME_LOGIN:
                uname_login(session, stype, ctype, body, utag, proto_type);
                break;
            case Cmd.Auth.GET_VERIFY_VIA_REG:
                phone_reg_identify_code(session, stype, ctype, body, utag, proto_type);
                break;
            case Cmd.Auth.REG_PHONE_ACC:
                reg_phone_acc(session, stype, ctype, body, utag, proto_type);
                break;
            case Cmd.Auth.GET_VERIFY_VIA_FORGET_PWD:
                reset_pwd_identify_code(session, stype, ctype, body, utag, proto_type);
                break;
            case Cmd.Auth.RESET_PWD_ACC:
                reset_pwd_acc(session, stype, ctype, body, utag, proto_type);
                break;
            default:
                break;
        }
    },

    on_server_recv_cmd: function(session, stype, ctype, body, utag, proto_type, raw_cmd){
        log.info("server recv cmd: ", ctype, body);
    },

    on_player_disconnect: function(session, stype){

    }
}

module.exports = service;