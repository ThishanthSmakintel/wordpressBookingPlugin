<?php
namespace AppointEase\WebSocket;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class Server implements MessageComponentInterface {
    protected $clients;
    protected $subscriptions;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->subscriptions = [];
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        error_log("New connection: {$conn->resourceId}");
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);
        
        if (!$data || !isset($data['type'])) {
            return;
        }

        switch ($data['type']) {
            case 'subscribe':
                $email = $data['email'] ?? null;
                if ($email) {
                    $this->subscriptions[$email][] = $from;
                    $from->send(json_encode(['type' => 'subscribed', 'email' => $email]));
                }
                break;

            case 'ping':
                $from->send(json_encode(['type' => 'pong', 'timestamp' => time()]));
                break;
        }
    }

    public function onClose(ConnectionInterface $conn) {
        $this->clients->detach($conn);
        foreach ($this->subscriptions as $email => $connections) {
            $this->subscriptions[$email] = array_filter($connections, fn($c) => $c !== $conn);
        }
        error_log("Connection closed: {$conn->resourceId}");
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        error_log("WebSocket error: {$e->getMessage()}");
        $conn->close();
    }

    public function broadcast($event, $data, $email = null) {
        $message = json_encode(['type' => $event, 'data' => $data, 'timestamp' => time()]);
        
        if ($email && isset($this->subscriptions[$email])) {
            foreach ($this->subscriptions[$email] as $conn) {
                $conn->send($message);
            }
        } else {
            foreach ($this->clients as $client) {
                $client->send($message);
            }
        }
    }
}
