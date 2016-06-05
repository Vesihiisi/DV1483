/**
 * Extend connection object with properties we'll need.
 */
var WebSocketConnection = require('websocket').connection;
var Message = require("./Message");
var gravatar = require('gravatar'); // get gravatar from email address
var includes = require('array-includes'); // check if array contains element
var config = require('./config'); // configuration settings
var unavailableNames = config.unavailableNames; // you can't change to this name
var serverName = config.serverName; // 'username' to sign server announcements
var sanitize = require('sanitize-html'); // clean up user input to prevent injections

WebSocketConnection.prototype.username = null;
WebSocketConnection.prototype.img = null;

WebSocketConnection.prototype.usernameIsOnTheProhibitedList = function(name, array) {
    if (includes(array, name)) {
        return true;
    } else {
        return false;
    }
}

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
        if (group.userExists(name) || this.usernameIsOnTheProhibitedList(name, unavailableNames)) { // if before chat starts, prevent duplicates by adding a number
            name = name + "_2";
        }
        this.username = name;
        group.sendToAll(new Message(serverName, this.username + " has joined.", "notification"))
    } else { // but if a user attempts during chat, don't do anything, simply prevent
        if (group.userExists(name) || this.usernameIsOnTheProhibitedList(name, unavailableNames)) {
            this.sendToOne(new Message(serverName, "Name change failed.", "warning"))
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
}
WebSocketConnection.prototype.getImg = function() {
    return this.img;
}

module.exports = WebSocketConnection;
