pm2 start apps/gateway/gateway.js
pm2 start apps/center_server/center_server.js
pm2 start apps/system_server/system_server.js
pm2 start apps/game_server/game_server.js
pm2 start apps/webserver/webserver.js -i 4
