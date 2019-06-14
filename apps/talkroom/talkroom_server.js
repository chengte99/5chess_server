require("../../init");
var netbus = require("../../netbus/netbus");
var proto_man = require("../../netbus/proto_man");
var service_manager = require("../../netbus/service_manager");
var talkroom = require("./talkroom");

netbus.start_tcp_server("127.0.0.1", 6084, true);
netbus.start_ws_server("127.0.0.1", 6085, true);

service_manager.register_service(1, talkroom);