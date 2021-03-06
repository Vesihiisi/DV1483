var config = {};

// Enable to have console.log of stuff that's going on!
config.debug = true;

// Enable to console.log all incoming chat messages
config.debugMessages = true;

// Port on which to deploy server
config.port = 4321;

// Origins from which to accept connections
config.allowedOrigins = ['http://www.student.bth.se',
    'http://127.0.0.1',
    'http://localhost'
]

// Username with which to sign server messages
config.serverName = "Server";

// Names we don't want users to use
config.unavailableNames = [this.serverName];


// Directory in which to save log files
config.logFile = "log.txt";


module.exports = config;
