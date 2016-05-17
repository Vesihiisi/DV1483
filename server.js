// Require the modules we need
var http = require('http');
var WebSocketServer = require('websocket').server;
var WebSocketConnection = require('websocket').connection;
var week = require('week');
var includes = require('array-includes'); // check if array contains element
var sanitize = require('sanitize-html'); // clean up user input to prevent injections
var gravatar = require('gravatar'); // get gravatar from email address
var fs = require('fs'); // for saving log files
var moment = require('moment'); // for formatting timestamp in log files
var config = require('./config'); // configuration settings
var port = config.port;
var filename = config.logFile; // log saved here
var serverName = config.serverName; // 'username' to sign server announcements
var allowedOrins = config.allowedOrigins; // only accept connections from these
var i;


// Convert Date object to unix timestamp
// https://coderwall.com/p/rbfl6g/how-to-get-the-correct-unix-timestamp-from-any-date-in-javascript
Date.prototype.getUnixTime = function() {
    return this.getTime() / 1000 | 0
};
if (!Date.now) Date.now = function() {
    return new Date();
}
Date.time = function() {
    return Date.now().getUnixTime();
}




// Create a http server with a callback handling all requests
var httpServer = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(200, { 'Content-type': 'text/plain' });
    response.end('This is a chat server!\n');
});




/**
 * Object model for messages.
 * Types are following: default (chat message), warning, announcement.
 */
function Message(author, content, type) {
    this.author = author;
    this.content = sanitize(content, {
        allowedTags: [],
        allowedAttributes: []
    });
    this.type = type;
    this.timestamp = new Date().getUnixTime();
}

Message.prototype = {
    getAuthor: function() {
        return this.author;
    },
    getTimestamp: function() {
        return this.timestamp;
    },
    getContent: function() {
        return this.content;
    },
    getType: function() {
        return this.type;
    },
    toJson: function() {
        return JSON.stringify(this);
    },
    toFile: function(path) {
        // Timestamp will look like this: [2016-05-16T14:22:23+02:00]
        // Human readable but still makes sense if we ever want to parse it.
        fs.appendFile(path, "[" + moment.unix(this.getTimestamp()).format() + "] " + "[" + this.getAuthor() + "] " + this.getContent() + "\n");
    }
}

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



/**
 * Extend connection object with properties we'll need.
 */

WebSocketConnection.prototype.username = null;
WebSocketConnection.prototype.img = null;
WebSocketConnection.prototype.setUsername = function(name, group, mode) {
    mode = mode || null;
    name = name.trim() // whitespace is messy and causes confusion
    if (name.substring(0, 1) == '/') {
        name = name.substring(1); // no you can't have a name that starts with a slash
    }
    name = sanitize(name, { // prevent injections
        allowedTags: [],
        allowedAttributes: []
    });
    if (mode === "initial") { // duplicate check
        if (group.userExists(name)) { // if before chat starts, prevent duplicates by adding a number
            name = name + "_2";
        }
        this.username = name;
        group.sendToAll(new Message(serverName, this.username + " has joined.", "notification"))
    } else { // but if a user attempts during chat, don't do anything, simply prevent
        if (group.userExists(name)) {
            this.sendToOne(new Message(serverName, "Can't change name", "warning"))
        } else {
            var oldName = this.username;
            this.username = name;
            this.sendNameChangeNotification(group, oldName, this.username)
        }
    }

}
WebSocketConnection.prototype.getUsername = function() {
    return this.username;
}
WebSocketConnection.prototype.sendToOne = function(message) {
    this.sendUTF(message.toJson());
}
WebSocketConnection.prototype.sendOwnName = function() {
    this.sendToOne(new Message(serverName, this.getUsername(), "user-name"));
}
WebSocketConnection.prototype.sendNameChangeNotification = function(group, oldName, newName) {
    group.sendToAll(new Message(serverName, oldName + " is now known as " + newName + ".", "notification"))
}
WebSocketConnection.prototype.setImg = function(email) {
    this.img = gravatar.url(email, { s: '200', d: 'identicon' }, false);
    console.log(this.img)
}
WebSocketConnection.prototype.getImg = function() {
    return this.img;
}


/**
 * Object model for a group of connections
 * that is, all the users connected to the chat.
 */
var ConnectionGroup = function(array) {
    this.connections = array;
}


ConnectionGroup.prototype.sendToAll = function(message) {
    for (i = 0; i < this.connections.length; i++) {
        this.connections[i].sendUTF(message.toJson());
    }
}

ConnectionGroup.prototype.add = function(connection) {
    this.connections.push(connection);
    this.sendUsernames();
}

ConnectionGroup.prototype.remove = function(connection) {
    this.connections.splice(this.connections.indexOf(connection), 1);
    this.sendUsernames();
}

ConnectionGroup.prototype.getNumber = function() {
    return this.connections.length;
}

ConnectionGroup.prototype.userExists = function(name) {
    for (i = 0; i < this.connections.length; i++) {
        if (this.connections[i].getUsername() === name) {
            return true;
        }
    }
    return false;
}

ConnectionGroup.prototype.getUsernames = function() {
    var list = [];
    for (i = 0; i < this.connections.length; i++) {
        var userData = {
            "img": this.connections[i].getImg(),
            "username": this.connections[i].getUsername()
        };
        list.push(userData.username);
        list.push(userData.img);
    }
    return list;
}

ConnectionGroup.prototype.sendUsernames = function() {
    var message = new Message(serverName, this.getUsernames(), "user-list");
    this.sendToAll(message)
}

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
    allConnections.sendUsernames();

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
                    case "me":
                        connection.setUsername(argument, allConnections);
                        connection.sendOwnName();
                        allConnections.sendUsernames();
                        break;
                    case "me_first":
                        connection.setUsername(argument, allConnections, "initial");
                        connection.sendOwnName();
                        allConnections.sendUsernames();
                        break;
                    case "get_img":
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
        var username = connection.username;
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        allConnections.remove(connection);
        allConnections.sendToAll(new Message(serverName, username + " has left.", "notification"));
        console.log("Active connections: " + allConnections.getNumber());
    });
});
