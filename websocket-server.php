<?php
/**
 * WebSocket Server Runner
 * Run: php websocket-server.php
 */

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/includes/class-websocket-server.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use AppointEase\WebSocket\Server;

$port = 8080;
$host = '0.0.0.0'; // Listen on all interfaces

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new Server()
        )
    ),
    $port,
    $host
);

echo "WebSocket server running on {$host}:{$port}\n";
echo "Connect via: ws://blog.promoplus.com:{$port}\n";
$server->run();
