/**
 * Object model for a group of connections
 * that is, all the users connected to the chat.
 */
var Message = require("./Message");
var config = require('./config'); // configuration settings
var serverName = config.serverName; // 'username' to sign server announcements

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

module.exports = ConnectionGroup;
