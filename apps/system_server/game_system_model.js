var mysql_center = require("../../database/mysql_center");
var redis_center = require("../../database/redis_center");
var Response = require("../Response");
var utils = require("../../utils/utils");
var mysql_game = require("../../database/mysql_game");
var redis_game = require("../../database/redis_game");
var game_config = require("../game_config");

function write_err(status, ret_func){
    var ret = {};
    ret[0] = status;
    ret_func(ret);
}

function check_user_login_bonus(uid){
    mysql_game.check_user_login_bonus(uid, function(status, sql_result){
        if(status != Response.OK){
            return;
        }

        var user_login_bonus_config = game_config.ugame_config.user_login_bonus_config;

        if(sql_result.length <= 0){
            mysql_game.insert_user_login_bonus(uid, user_login_bonus_config.bonus_list[0], function(status){
                if(status != Response.OK){
                    return;
                }
                return;
            });
        }else{
            var sql_login_bonus = sql_result[0];
            var has_bonus = sql_login_bonus.bonus_time < utils.timestamp_today();
            if(has_bonus){
                var days = 1;
                var is_straight = sql_login_bonus.bonus_time >= utils.timestamp_yesterday();
                if(is_straight){
                    days = sql_login_bonus.days + 1;
                }

                var index = days - 1;
                if(days > user_login_bonus_config.bonus_list.length){
                    if(user_login_bonus_config.clear_login_straight){
                        days = 1;
                        index = 0;
                    }else{
                        index = user_login_bonus_config.bonus_list.length - 1;
                    }
                }

                //更新bonus
                mysql_game.update_user_login_bonus(uid, user_login_bonus_config.bonus_list[index], days, function(status){
                    if(status != Response.OK){
                        return;
                    }
                    return;
                });
            }
        }
    });
}

function get_game_info_success(uid, data, ret_func){
    var ret = {};
    ret[0] = Response.OK;
    ret[1] = data.uexp;
    ret[2] = data.uchip;
    ret[3] = data.uvip;

    redis_game.set_ugame_info_inredis(uid, {
        uexp: data.uexp,
        uchip: data.uchip,
        uvip: data.uvip,
    });

    redis_game.update_world_rank_info("NODE_GAME_WORLD_RANK", uid, data.uchip);

    //check bonus
    check_user_login_bonus(uid);

    ret_func(ret);
}

function get_login_bonus_info_success(uid, data, is_got, ret_func){
    var ret = {};
    ret[0] = Response.OK;
    ret[1] = is_got;
    if(is_got != 1){
        ret_func(ret);
        return;
    }

    ret[2] = data.id;
    ret[3] = data.bonus;
    ret[4] = data.days;

    ret_func(ret);
}

function recv_login_bonus_success(uid, id, data, ret_func){
    var ret = {};
    ret[0] = Response.OK;
    ret[1] = data.bonus;

    redis_game.get_ugame_info_inredis(uid, function(status, ugame_info){
        if(status != Response.OK){
            console.log("redis_game get_ugame_info_inredis failed", status);
            return;
        }

        ugame_info.uchip += data.bonus;

        redis_game.set_ugame_info_inredis(uid, ugame_info);
    })

    ret_func(ret);
}

function get_players_world_rank_info_success(my_rank, uinfo, ret_func){
    var ret = {};
    ret[0] = Response.OK;
    ret[1] = uinfo.length;
    ret[2] = uinfo;
    ret[3] = my_rank;
    
    ret_func(ret);
}

function update_game_info_uchip(uid, id, data, ret_func){
    mysql_game.update_game_info_uchip_by_uid(uid, data.bonus, true, function(status, sql_result){
        if(status != Response.OK){
            write_err(status, ret_func);
            return;
        }

        recv_login_bonus_success(uid, id, data, ret_func);
    })
}

function update_login_bonus(uid, id, data, ret_func){
    mysql_game.update_login_bonus(id, function(status, sql_result){
        if(status != Response.OK){
            write_err(status, ret_func);
            return;
        }

        update_game_info_uchip(uid, id, data, ret_func);
    })
}

function get_players_world_rank_info(my_uid, data, ret_func){
    var rank_array = [];
    var total_len = Math.floor(data.length / 2);
    var is_sended = false;
    var loaded = 0;
    var my_rank = -1;
    
    for(var i = 0; i < total_len; i ++){
        rank_array.push([]); //填入空陣列
    }

    var call_func = function(uid, uchip, out_array){
        redis_center.get_uinfo_inredis(uid, function(status, data){
            if(status != Response.OK){
                if(!is_sended){
                    write_err(status, ret_func);
                    is_sended = true;
                }
                return;
            }

            out_array.push(data.unick);
            out_array.push(data.usex);
            out_array.push(data.uface);
            out_array.push(uchip);
            loaded ++;

            //rank_array已全部取得
            if(loaded >= total_len){
                get_players_world_rank_info_success(my_rank, rank_array, ret_func);
            }
        })
    }

    // 依照uid獲取用戶info, [unick, usex, uface, uchip]
    for(var j = 0; j < data.length; j += 2){
        if(my_uid == data[j]){
            my_rank = (j / 2) + 1;
        }
        call_func(data[j], data[j + 1], rank_array[j / 2]);
    }
}

function get_game_info_by_uid(uid, ret_func){
    mysql_game.get_game_info_by_uid(uid, function(status, sql_result){
        if(status != Response.OK){
            write_err(status, ret_func);
            return;
        }

        if(sql_result.length <= 0){
            mysql_game.insert_game_info(uid, game_config.ugame_config.first_uexp, game_config.ugame_config.first_uchip, function(status){
                if(status != Response.OK){
                    write_err(status, ret_func);
                    return;
                }

                get_game_info_by_uid(uid, ret_func);
            });
        }else{
            var data = sql_result[0];

            get_game_info_success(uid, data, ret_func);
        }
    });
}

function get_login_bonus_info_by_uid(uid, ret_func){
    mysql_game.check_user_login_bonus(uid, function(status, sql_result){
        if(status != Response.OK){
            write_err(status, ret_func);
            return;
        }

        if(sql_result.length <= 0){
            write_err(Response.INVAILD_OPT, ret_func);
            return;
        }else{
            var data = sql_result[0];
            if(data.status){
                get_login_bonus_info_success(uid, data, 0, ret_func);
            }else{
                get_login_bonus_info_success(uid, data, 1, ret_func);
            }

        }
    });
}

function recv_login_bonus(uid, id, ret_func){
    mysql_game.check_user_login_bonus(uid, function(status, sql_result){
        if(status != Response.OK){
            write_err(status, ret_func);
            return;
        }

        if(sql_result.length <= 0){
            write_err(Response.INVAILD_OPT, ret_func);
            return;
        }else{
            var data = sql_result[0];
            if(data.status != 0){
                write_err(Response.INVAILD_OPT, ret_func);
                return;
            }

            update_login_bonus(uid, id, data, ret_func);
        }
    });
}

function get_world_rank_info(uid, ret_func){
    redis_game.get_world_rank_info("NODE_GAME_WORLD_RANK", 30, function(status, data){
        if(status != Response.OK){
            write_err(status, ret_func);
            return;
        }

        if(!data || data.length <= 0){
            write_err(Response.RANK_IS_EMPTY, ret_func);
            return;
        }

        for(var i = 0; i < data.length; i ++){
            data[i] = parseInt(data[i]);
        }

        // data = [uid, uchip, uid, uchip, .....]
        get_players_world_rank_info(uid, data, ret_func);
    });
}

module.exports = {
    get_game_info_by_uid: get_game_info_by_uid,
    get_login_bonus_info_by_uid: get_login_bonus_info_by_uid,
    recv_login_bonus: recv_login_bonus,
    get_world_rank_info: get_world_rank_info,
}