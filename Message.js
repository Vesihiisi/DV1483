/**
 * Object model for messages.
 * Types are following: default (chat message), warning, announcement.
 */
var fs = require('fs'); // for saving log files
var sanitize = require('sanitize-html'); // clean up user input to prevent injections
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

module.exports = Message;
