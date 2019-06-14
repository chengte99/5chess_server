require("../init");
var netbus = require("../netbus/netbus");
var proto_man = require("../netbus/proto_man");
var service_manager = require("../netbus/service_manager");
var talk_room = require("./talk_room");

netbus.start_tcp_server("127.0.0.1", 6080, proto_man.PROTO_JSON, true);
netbus.start_tcp_server("127.0.0.1", 6081, proto_man.PROTO_BUF, true);
netbus.start_ws_server("127.0.0.1", 6082, proto_man.PROTO_JSON, true);
netbus.start_ws_server("127.0.0.1", 6083, proto_man.PROTO_BUF, true);

service_manager.register_service(talk_room.stype, talk_room);