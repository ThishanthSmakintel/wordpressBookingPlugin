#!/bin/bash

# AppointEase WebSocket Setup Script
# One-click installation for WebSocket real-time updates

set -e

echo "=========================================="
echo "  AppointEase WebSocket Setup"
echo "=========================================="
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${YELLOW}Warning: Running as root. Will use 'www-data' user for supervisor.${NC}"
    SUPERVISOR_USER="www-data"
else
    SUPERVISOR_USER="$USER"
fi

# Step 1: Check Composer
echo -e "${YELLOW}[1/6] Checking Composer...${NC}"
if ! command -v composer &> /dev/null; then
    echo -e "${RED}✗ Composer not found!${NC}"
    echo "Install Composer: https://getcomposer.org/download/"
    exit 1
fi
echo -e "${GREEN}✓ Composer found${NC}"

# Step 2: Install Dependencies
echo -e "${YELLOW}[2/6] Installing dependencies...${NC}"
composer install --no-dev --optimize-autoloader
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Check if port 8080 is available
echo -e "${YELLOW}[3/6] Checking port 8080...${NC}"
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Port 8080 is already in use${NC}"
    read -p "Do you want to use a different port? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter port number: " PORT
    else
        echo "Skipping port configuration"
        PORT=8080
    fi
else
    PORT=8080
    echo -e "${GREEN}✓ Port 8080 is available${NC}"
fi

# Step 4: Setup method selection
echo -e "${YELLOW}[4/6] Choose setup method:${NC}"
echo "1) Screen (Simple, manual restart)"
echo "2) Supervisor (Recommended, auto-restart)"
echo "3) Manual (I'll start it myself)"
read -p "Enter choice [1-3]: " -n 1 -r
echo

case $REPLY in
    1)
        # Screen setup
        echo -e "${YELLOW}Setting up with screen...${NC}"
        if ! command -v screen &> /dev/null; then
            echo -e "${RED}✗ Screen not found. Installing...${NC}"
            if command -v apt-get &> /dev/null; then
                sudo apt-get update && sudo apt-get install -y screen
            elif command -v yum &> /dev/null; then
                sudo yum install -y screen
            else
                echo -e "${RED}Cannot install screen automatically. Please install manually.${NC}"
                exit 1
            fi
        fi
        
        # Start in screen
        screen -dmS appointease-ws bash -c "cd '$SCRIPT_DIR' && php websocket-server.php"
        sleep 2
        
        if screen -list | grep -q "appointease-ws"; then
            echo -e "${GREEN}✓ WebSocket server started in screen session${NC}"
            echo "  To view: screen -r appointease-ws"
            echo "  To detach: Ctrl+A then D"
        else
            echo -e "${RED}✗ Failed to start screen session${NC}"
            exit 1
        fi
        ;;
        
    2)
        # Supervisor setup
        echo -e "${YELLOW}Setting up with supervisor...${NC}"
        if ! command -v supervisorctl &> /dev/null; then
            echo -e "${RED}✗ Supervisor not found. Installing...${NC}"
            if command -v apt-get &> /dev/null; then
                sudo apt-get update && sudo apt-get install -y supervisor
            elif command -v yum &> /dev/null; then
                sudo yum install -y supervisor
                sudo systemctl enable supervisord
                sudo systemctl start supervisord
            else
                echo -e "${RED}Cannot install supervisor automatically. Please install manually.${NC}"
                exit 1
            fi
        fi
        
        # Create supervisor config
        SUPERVISOR_CONF="/etc/supervisor/conf.d/appointease-websocket.conf"
        echo -e "${YELLOW}Creating supervisor config...${NC}"
        
        sudo tee "$SUPERVISOR_CONF" > /dev/null <<EOF
[program:appointease-websocket]
command=php $SCRIPT_DIR/websocket-server.php
directory=$SCRIPT_DIR
autostart=true
autorestart=true
user=$SUPERVISOR_USER
stdout_logfile=/var/log/appointease-websocket.log
stderr_logfile=/var/log/appointease-websocket-error.log
environment=HOME="/home/$SUPERVISOR_USER",USER="$SUPERVISOR_USER"
EOF
        
        # Reload supervisor
        sudo supervisorctl reread
        sudo supervisorctl update
        sudo supervisorctl start appointease-websocket
        
        sleep 2
        
        if sudo supervisorctl status appointease-websocket | grep -q "RUNNING"; then
            echo -e "${GREEN}✓ WebSocket server started with supervisor${NC}"
            echo "  Status: sudo supervisorctl status appointease-websocket"
            echo "  Restart: sudo supervisorctl restart appointease-websocket"
            echo "  Logs: tail -f /var/log/appointease-websocket.log"
        else
            echo -e "${RED}✗ Failed to start supervisor service${NC}"
            sudo supervisorctl status appointease-websocket
            exit 1
        fi
        ;;
        
    3)
        # Manual
        echo -e "${GREEN}✓ Dependencies installed. Start manually with:${NC}"
        echo "  cd $SCRIPT_DIR"
        echo "  php websocket-server.php"
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Step 5: Configure firewall
echo -e "${YELLOW}[5/6] Configuring firewall...${NC}"
if command -v ufw &> /dev/null && sudo ufw status | grep -q "Status: active"; then
    sudo ufw allow $PORT/tcp
    echo -e "${GREEN}✓ UFW firewall rule added${NC}"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=$PORT/tcp
    sudo firewall-cmd --reload
    echo -e "${GREEN}✓ Firewalld rule added${NC}"
else
    echo -e "${YELLOW}⚠ No firewall detected or not active${NC}"
fi

# Step 6: Test connection
echo -e "${YELLOW}[6/6] Testing WebSocket connection...${NC}"
sleep 2

if timeout 3 bash -c "echo > /dev/tcp/localhost/$PORT" 2>/dev/null; then
    echo -e "${GREEN}✓ WebSocket server is responding on port $PORT${NC}"
else
    echo -e "${RED}✗ Cannot connect to WebSocket server${NC}"
    echo "Check logs for errors"
    exit 1
fi

# Success message
echo ""
echo "=========================================="
echo -e "${GREEN}✓ WebSocket Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "WebSocket URL: ws://$(hostname):$PORT"
echo ""
echo "Next steps:"
echo "1. Ensure port $PORT is open in your hosting firewall"
echo "2. Test at: http://yoursite.com/wp-content/plugins/wordpressBookingPlugin/test-websocket.html"
echo "3. Check WordPress admin for connection status"
echo ""
echo "Troubleshooting:"
echo "  View logs: tail -f /var/log/appointease-websocket.log"
echo "  Check status: ps aux | grep websocket"
echo ""
