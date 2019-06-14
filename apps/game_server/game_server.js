require("../../init");
var netbus = require("../../netbus/netbus");
var proto_man = require("../../netbus/proto_man");
var service_manager = require("../../netbus/service_manager");
var game_config = require("../game_config");
var five_chess_service = require("./five_chess_service");
var Stype = require("../Stype");
var mysql_center = require("../../database/mysql_center");
var redis_center = require("../../database/redis_center");
var mysql_game = require("../../database/mysql_game");
var redis_game = require("../../database/redis_game");

var five_chess_server = game_config.five_chess_server;

netbus.start_tcp_server(five_chess_server.host, five_chess_server.port, false);
service_manager.register_service(Stype.Game5Chess, five_chess_service);

var game_mysql = game_config.game_database;
mysql_game.connect(game_mysql.host, game_mysql.port, game_mysql.database, game_mysql.user, game_mysql.password);

var center_redis = game_config.center_redis;
redis_center.connect(center_redis.host, center_redis.port, center_redis.db_index);

var game_redis = game_config.game_redis;
redis_game.connect(game_redis.host, game_redis.port, game_redis.db_index);