var Cmd = {
    USER_DISCONNECT: 10000,
    BROADCAST: 10001,

    Auth: {
        GUEST_LOGIN: 1,
        RELOGIN: 2,
        EDIT_PROFILE: 3,
        GET_VERIFY_VIA_UPGRADE: 4,
        BIND_PHONE_NUM: 5,
        UNAME_LOGIN: 6,

        GET_VERIFY_VIA_REG: 7,
        REG_PHONE_ACC: 8,
        GET_VERIFY_VIA_FORGET_PWD: 9,
        RESET_PWD_ACC: 10,
    },

    GameSystem: {
        GET_GAME_INFO: 1,
        GET_LOGIN_BONUS_INFO: 2,
        RECV_LOGIN_BONUS: 3,
        GET_WORLD_RANK_INFO: 4,
    },

    Game5Chess: {
        ENTER_ZONE: 1,
        USER_QUIT: 2,
        ENTER_ROOM: 3,
        EXIT_ROOM: 4,
        USER_SITDOWN: 5,
        USER_STANDUP: 6,
        USER_ARRIVED: 7,
        SEND_PROP: 8,
        DO_READY: 9,
        ROUND_GAME_START: 10,
        TURN_TO_PLAYER: 11,
        PUT_CHESS: 12,
        CHECKOUT: 13,
        CHECKOUT_OVER: 14,
        RECONNECT: 15,
        GET_PREV_ROUND_DATA: 16,
    },
};

module.exports = Cmd;