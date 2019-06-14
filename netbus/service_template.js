var service = {
    name: "service template",
    is_transfer: false,

    on_player_recv_cmd: function(session, stype, ctype, body, utag, proto_type, raw_cmd){

    },

    on_server_recv_cmd: function(session, stype, ctype, body, utag, proto_type, raw_cmd){
        log.info("server recv cmd: ", ctype, body);
    },

    on_player_disconnect: function(session, stype){

    }
}

module.exports = service;