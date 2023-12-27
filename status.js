const fs = require('fs');
const sqlite3 = require('sqlite3');
const { _db_user_count, _db_game } = require('./userh.js');
const SERVER_STATUS_XMLOUT = "./www/status.xml";
const SERVER_DATABASE = './database.db';

/**
 * Update Status Logfile
 */
function updateStatus() {
  // Open Logfile
  const log = fs.createWriteStream(SERVER_STATUS_XMLOUT);

  // Opened Logfile
  if (log) {
    // Write XML Header
    log.write('<?xml version="1.0" encoding="UTF-8"?>\n');

    // Write XSL Processor Information
    log.write('<?xml-stylesheet type="text/xsl" href="status.xsl"?>\n');

    // Output Root Tag + User Count
    log.write(`<prometheus usercount="${_db_user_count}">\n`);

    // Database Handle
    const db = new sqlite3.Database(SERVER_DATABASE);

    // Open Database
    db.serialize(() => {
      // Iterate Games
      let game = _db_game;
      while (game !== null) {
        const productid = game.game.data.toString('utf-8');
        let displayname = '';

        // Fetch Game Name from Database
        db.get('SELECT name FROM productids WHERE id=?', [productid], (err, row) => {
          if (err) {
            // Handle error
            displayname = productid; // Fallback to product ID
          } else {
            displayname = row ? row.name : productid;
          }

          // Output Game Tag + Game Name
          log.write(`\t<game name="${displayname}" usercount="${game.playercount}">\n`);

          // ... (rest of your code)

          // Output Closing Game Tag
          log.write('\t</game>\n');

          game = game.next;
        });
      }
    });

    // Output Closing Root Tag
    log.write('</prometheus>');

    // Close Logfile
    log.end();
  }
}

module.exports = {
    updateStatus
}