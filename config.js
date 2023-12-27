const SERVER_PORT = 27312;

// Listener Connection Backlog (aka. Max Concurrent Logins)
const SERVER_LISTEN_BACKLOG = 128;

// Server User Maximum
const SERVER_USER_MAXIMUM = 1024;

// Server User Timeout (in seconds)
const SERVER_USER_TIMEOUT = 15;

// Server SQLite3 Database
const SERVER_DATABASE = "database.db";

// Server Status Logfile
const SERVER_STATUS_XMLOUT = "www/status.xml";

// Server Shutdown Message
const SERVER_SHUTDOWN_MESSAGE = "PROMETHEUS HUB IS SHUTTING DOWN!";

module.exports = {
    SERVER_PORT,
    SERVER_LISTEN_BACKLOG,
    SERVER_USER_MAXIMUM,
    SERVER_USER_TIMEOUT,
    SERVER_DATABASE,
    SERVER_STATUS_XMLOUT,
    SERVER_SHUTDOWN_MESSAGE
}