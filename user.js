const server = require('./server');
const { updateStatus} = require('./status')
const sqlite3 = require('sqlite3').verbose();
const SERVER_DATABASE = './database.db';

let _db_user_count = 0;

// Define user database
let _db_user = null;

// Define game database
let _db_game = null;


function login_user_data(user, data) {
    //console.log(`User ${user.id} logged in with the following data:`);
    //console.log(`- Opcode: ${parsedLoginPacket.base.opcode}`);
    //console.log(`- MAC Address: ${parsedLoginPacket.mac.data}`);
    //console.log(`- Game Product Code: ${parsedLoginPacket.game.data}`);
    //console.log(`- Player Nickname: ${parsedLoginPacket.name.data}`);
    
    // Add your application-specific logic here
    
    // For example, you might want to store the user information, perform authentication, etc.

    if (!user.resolver) {
        user.resolver = {};
      }
    
      // Ensure user.resolver.ip is initialized as an array
      if (!Array.isArray(user.resolver.ip)) {
        user.resolver.ip = [];
      }
    
    // Product Code Check
  let validProductCode = true;

  // Iterate Characters
  for (let i = 0; i < server(PRODUCT_CODE_LENGTH) && validProductCode; i++) {
    // Valid Characters
    if (!((data.game.data[i] >= 'A' && data.game.data[i] <= 'Z') || (data.game.data[i] >= '0' && data.game.data[i] <= '9'))) {
      validProductCode = false;
    }
  }

  // Valid Packet Data
  if (
    validProductCode &&
    Buffer.compare(Buffer.from(data.mac.data, 'hex'), Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF])) !== 0 &&
    Buffer.compare(Buffer.from(data.mac.data, 'hex'), Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00])) !== 0 &&
    data.name.data[0] !== 0
  ) {
    // Game Product Override
    gameProductOverride(data.game);

    // Find existing Game
    let game = _db_game;
    while (game !== null && game.game.data.compare(data.game.data) !== 0) {
      game = game.next;
    }

    // Game not found
    if (game === null) {
      // Allocate Game Node Memory
      game = {
        game: data.game,
        next: _db_game,
        prev: null,
        playercount: 0,
      };

      // Link into Game List
      if (_db_game !== null) {
        _db_game.prev = game;
      }
      _db_game = game;
      //console.log(_db_game);
    }

    // Game now available
    if (game !== null) {
      // Save MAC
      user.resolver.mac = Buffer.from(data.mac.data, 'hex');

      // Save Nickname
      user.resolver.name = Buffer.from(data.name.data, 'utf-8');

      // Increase Player Count in Game Node
      game.playercount++;

      // Link Game to Player
      user.game = game;

      // Notify User
      const ip = user.resolver.ip.length > 0 ? user.resolver.ip.join('.') : 'unknown';
      const safegamestr = game.game.data.toString('utf-8');
      console.log(
        `${user.resolver.name.toString('utf-8')} (MAC: ${user.resolver.mac.toString('hex')} - IP: ${ip}) started playing ${safegamestr}.`
      );

      // Update Status Log
      //updateStatus();

      // Leave Function
      return;
    }
  }

  // Invalid Packet Data
  else {
    // Notify User
    const ip = user.resolver.ip.join('.');
    console.log(`Invalid Login Packet Contents from ${ip}.`);
  }

  // Logout User - Out of Memory or Invalid Arguments
  logoutUser(user);
  
    // After handling the login data, you might want to send a response back to the user if needed
    const response = "Login successful";
    user.socket.write(response);
  
    // Close the connection if needed
    // user.socket.end();
  }
  
  function connect_user(user, parsedConnectPacket) {
      console.log(`- Opcode: ${parsedConnectPacket.base.opcode}`);
      console.log(`- Group: ${parsedConnectPacket.group.data}`);
  
  
      const response = "connection successful"
      user.socket.write(response)
  }

// Function to handle game product override
function gameProductOverride(product) {
  // Safe Product Code
  const productId = product.data.slice(0, server(PRODUCT_CODE_LENGTH));

  // Database Handle
  const db = new sqlite3.Database(SERVER_DATABASE);

  // Crosslinked Flag
  let crosslinked = false;

  // Exists Flag
  let exists = false;

  // SQL Statements
  const sql = 'SELECT id_to FROM crosslinks WHERE id_from=?;';
  const sql2 = 'SELECT * FROM productids WHERE id=?;';
  const sql3 = 'INSERT INTO productids(id, name) VALUES(?, ?);';

  // Prepare SQL Statement
  db.serialize(() => {
    // Check for crosslink
    const statement1 = db.prepare(sql);
    statement1.get(productId, (err, row) => {
        if (err) {
          console.error('Crosslink Error: ' + err.message);
          statement1.finalize(); // Make sure to finalize the statement in case of an error
          return;
        }
      
        if (row) {
          // Crosslink Product Code
          product.data = Buffer.from(row.id_to, 'utf-8');
      
          // Log Crosslink
          console.log(`Crosslinked ${productId} to ${row.id_to}.`);
      
          // Set Crosslinked Flag
          crosslinked = true;
        }
      
        statement1.finalize();
      
        // Not Crosslinked
        if (!crosslinked) {
          // Check if product exists
          const statement2 = db.prepare(sql2);
      
          statement2.get(productId, (err, row) => {
            if (err) {
              console.error('Check Product Exist: ' + err.message);
              statement2.finalize(); // Finalize the statement in case of an error
              return;
            }
      
            // Game exists in the database
            if (row) {
              // Set Exists Flag
              exists = true;
            }
      
            statement2.finalize();
      
            // Game doesn't exist in Database
            if (!exists) {
              // Add product to the database
              const statement3 = db.prepare(sql3);
      
              statement3.run(productId, productId, (err) => {
                if (err) {
                  console.error('Product Don\'t Exist: ' + err.message);
                  statement3.finalize(); // Finalize the statement in case of an error
                  return;
                }
      
                // Log Addition
                console.log(`Added Unknown Product ID ${productId} to Database.`);
                statement3.finalize(); // Finalize the statement after execution
              });
            }
          });
        }
      });
      //db.close();
  });

  // Close Database
}
async function getdggame() {
    console.log(_db_game);
    return await _db_game;
}

  module.exports = {
    login_user_data,
    connect_user,
    getUserCount: () => _db_user_count,
    getdggame,
  }