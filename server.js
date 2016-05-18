// Require the modules we need
var http = require('http');
var WebSocketServer = require('websocket').server;
var week = require('week');
var includes = require('array-includes'); // check if array contains element
var config = require('./config'); // configuration settings
var port = config.port;
var filename = config.logFile; // log saved here
var serverName = config.serverName; // 'username' to sign server announcements
var allowedOrins = config.allowedOrigins; // only accept connections from these
var Message = require("./Message"); // class for single message
var ConnectionGroup = require("./ConnectionGroup"); // class for abstraction around all connected clients
var WebSocketConnection = require("./WebSocketConnection");
var i;


// Create a http server with a callback handling all requests
var httpServer = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(200, { 'Content-type': 'text/plain' });
    response.end('This is a chat server!\n');
});


// Always check and explicitly allow the origin
function originIsAllowed(origin) {
    console.log("Origin: " + origin);
    if (includes(allowedOrins, origin)) {
        console.log("Origin allowed!");
        return true;
    }
    console.log("Origin not allowed!");
    return false;
}


// Setup the http-server to listen to a port
httpServer.listen(port, function() {
    console.log((new Date()) + ' HTTP server is listening on port ' + port);
});


// Create an object for the websocket
// https://github.com/Worlize/WebSocket-Node/wiki/Documentation
wsServer = new WebSocketServer({
    httpServer: httpServer,
    autoAcceptConnections: false
});


// Create array with all connected clients
var allConnections = new ConnectionGroup([]);


// Create a callback to handle each connection request
wsServer.on('request', function(request) {

    if (!originIsAllowed(request.origin)) {
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    var connection = request.accept('broadcast-protocol', request.origin);

    connection.sendOwnName();
    allConnections.add(connection);
    allConnections.sendUsernames(); // now the client can update list of participants

    console.log((new Date()) + ' Connection accepted from ' + request.origin);


    // Callback to handle each message from the client
    connection.on('message', function(indata) {
        if (indata.type === 'utf8') {
            var message = new Message(connection.getUsername(), indata.utf8Data, "default");

            console.log('Received Message: ' + indata.utf8Data);
            if (message.content.charAt(0) === "/") { // parsing fun starts here
                var noSlash = message.content.substring(1);
                var parts = noSlash.split(" ");
                var command = parts[0];
                parts.shift();
                var argument = parts.join(" "); // to be able to have whitespace inside argument, e.g. multiword user name
                switch (command) {
                    case "me": // user-initiated name setting request
                        connection.setUsername(argument, allConnections);
                        connection.sendOwnName();
                        allConnections.sendUsernames();
                        break;
                    case "me_first": // the initial name setting request when connecting to server
                        connection.setUsername(argument, allConnections, "initial");
                        connection.sendOwnName();
                        allConnections.sendUsernames();
                        break;
                    case "get_img": // automatic request for gravatar url
                        connection.setImg(argument);
                        connection.sendOwnName();
                        allConnections.sendUsernames();
                        break;
                }
            } else {
                allConnections.sendToAll(message);
                message.toFile(filename);
            }

        }
    });

    // Callback when client closes the connection
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        allConnections.remove(connection); // make sure connection is no longer in the array
        allConnections.sendToAll(new Message(serverName, connection.username + " has left.", "notification"));
        console.log("Active connections: " + allConnections.getNumber());
    });
});
