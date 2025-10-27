const http = require('http');

http.get('http://localhost:8080/debug', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('=== WebSocket Server Debug Info ===\n');
        console.log(JSON.parse(data));
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
