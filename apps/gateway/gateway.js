require("../../init");
var netbus = require("../../netbus/netbus");
var proto_man = require("../../netbus/proto_man");
var service_manager = require("../../netbus/service_manager");
var game_config = require("../game_config");
var gw_service = require("./gw_service");
var bc_service = require("./bc_service");
var Stype = require("../Stype");

var host = game_config.gateway_config.host;
var ports = game_config.gateway_config.ports;

netbus.start_tcp_server(host, ports[0], true);
netbus.start_ws_server(host, ports[1], true);

service_manager.register_service(Stype.Broadcast, bc_service);

var server_config = game_config.gw_connect_servers;
for(var key in server_config){
    netbus.start_tcp_client_to_connect_server(server_config[key].stype, server_config[key].host, server_config[key].port, true);
    service_manager.register_service(server_config[key].stype, gw_service);
}