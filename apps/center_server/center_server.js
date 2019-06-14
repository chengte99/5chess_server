require("../../init");
var netbus = require("../../netbus/netbus");
var proto_man = require("../../netbus/proto_man");
var service_manager = require("../../netbus/service_manager");
var game_config = require("../game_config");
var auth_service = require("./auth_service");
var Stype = require("../Stype");
var mysql_center = require("../../database/mysql_center");
var redis_center = require("../../database/redis_center");

var center_server = game_config.center_server;

netbus.start_tcp_server(center_server.host, center_server.port, false);
service_manager.register_service(Stype.Auth, auth_service);

var center_database = game_config.center_database;
mysql_center.connect(center_database.host, center_database.port, center_database.database, center_database.user, center_database.password);

var center_redis = game_config.center_redis;
redis_center.connect(center_redis.host, center_redis.port, center_redis.db_index);