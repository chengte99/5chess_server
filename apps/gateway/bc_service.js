require("./bc_proto");
var gw_service = require("./gw_service");

var service = {
    name: "broadcast service",
    is_transfer: false,

    on_player_recv_cmd: function(session, stype, ctype, body, utag, proto_type, raw_cmd){

    },

    on_server_recv_cmd: function(session, stype, ctype, body, utag, proto_type, raw_cmd){
        var cmd_buf = body.cmd_buf;
        var users = body.users;
        for(var i in users){
            var client_session = gw_service.get_session_by_uid(users[i]);
            if(!client_session){
                continue;
            }

            client_session.send_encoded_cmd(cmd_buf);
        }
    },

    on_player_disconnect: function(session, stype){

    }
}

module.exports = service;