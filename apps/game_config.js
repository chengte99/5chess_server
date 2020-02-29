var Stype = require("./Stype");
var HOST_IP = "127.0.0.1";

var game_config = {
    GATEWAY_CONNECT_IP: "47.92.0.77",

    gateway_config:{
        host: HOST_IP,
        ports: [6080, 6081],
    },

    webserver_config:{
        host: HOST_IP,
        port: 10001,
    },

    center_server: {
        host: HOST_IP,
        port: 6086,
        stypes: [Stype.Auth],
    },

    game_system_server: {
        host: HOST_IP,
        port: 6087,
        stypes: [Stype.GameSystem],
    },

    five_chess_server: {
        host: HOST_IP,
        port: 6088,
        stypes: [Stype.Game5Chess],
    },

    center_database: {
        host: HOST_IP,
        port: 3306,
        database: "bycw_center",
        user: "root",
        password: "asd12345"
    },

    game_database: {
        host: HOST_IP,
        port: 3306,
        database: "bycw_game_node",
        user: "root",
        password: "asd12345"
    },

    center_redis: {
        host: HOST_IP,
        port: 6379,
        db_index: 0,
    },

    game_redis: {
        host: HOST_IP,
        port: 6379,
        db_index: 1,
    },

    // 代碼生成
    gw_connect_servers:{
        // 0:{
        //     stype: Stype.TalkRoom,
        //     host: HOST_IP,
        //     port: 6084
        // },
        1:{
            stype: Stype.Auth,
            host: HOST_IP,
            port: 6086
        },
        2:{
            stype: Stype.GameSystem,
            host: HOST_IP,
            port: 6087
        },
        3:{
            stype: Stype.Game5Chess,
            host: HOST_IP,
            port: 6088
        },
    },

    ugame_config: {
        first_uexp: 1000,
        first_uchip: 1000,

        user_login_bonus_config: {
            clear_login_straight: false,
            bonus_list: [100, 200, 300, 400, 500],
        },

        //之後為代碼產生
        // 1. 寫入數據庫。2. 遍歷數據庫，利用腳本產生配置文件。3. 讀取配置文件製作遊戲分區。
        five_chess_zone: {
            0: {zid: 1, name: "新手場", enter_vip: 0, chip: 1000, one_round_chip: 20, think_time: 15},
            1: {zid: 2, name: "高手場", enter_vip: 0, chip: 3000, one_round_chip: 50, think_time: 10},
            2: {zid: 3, name: "大師場", enter_vip: 0, chip: 10000, one_round_chip: 100, think_time: 5},
        },
    }
};

module.exports = game_config;