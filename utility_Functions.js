const {
    SceNetAdhocctlGroupNode,
    SceNetAdhocctlGameNode,
    SceNetAdhocctlUserNode,
    USER_STATE_LOGGED_IN,
    USER_STATE_TIMED_OUT,
    USER_STATE_WAITING
} = require('./userh');
let { 
    _db_user_count,
    _db_user,
    _db_game
} = require('./userh.js');
const { SERVER_USER_MAXIMUM } = require('./config.js');
const { updateStatus } = require('./status.js');
const { PRODUCT_CODE_LENGTH, ADHOCCTL_GROUPNAME_LEN, SceNetAdhocctlConnectBSSIDPacketS2C, OPCODE_CONNECT_BSSID,SceNetAdhocctlConnectPacketS2C,  } = require('./packets.js');
const sqlite3 = require('sqlite3').verbose();
let {OPCODE_CONNECT} = require('./packets.js')
const { SERVER_DATABASE, SERVER_USER_TIMEOUT } = require('./config.js');
  // Assuming the necessary data structures and constants are already defined

  function loginUserData(user, data) {
    // Product Code Check
    let validProductCode = true;
    console.log(data);
    // Iterate Characters
    for (let i = 0; i < PRODUCT_CODE_LENGTH && validProductCode; i++) {
      // Valid Characters
      if (!((data.game.data[i] >= 'A' && data.game.data[i] <= 'Z') || (data.game.data[i] >= '0' && data.game.data[i] <= '9'))) {
        validProductCode = false;
      }
    }
  
    // Valid Packet Data
    const expectedMac1 = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
const expectedMac2 = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

// Assuming data.mac is a Buffer
if (!data.mac.data.equals(expectedMac1) && !data.mac.data.equals(expectedMac2)) {
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
        game = new SceNetAdhocctlGameNode();
  
        // Allocated Game Node Memory
        if (game !== null) {
          // Clear Memory
          game.initializeGroupNode();
  
          // Save Game Product ID
          game.game = data.game;
  
          // Link into Game List
          game.next = _db_game;
          if (_db_game !== null) _db_game.prev = game;
          _db_game = game;
        }
      }
  
      // Game now available
      if (game !== null) {
        // Save MAC
        user.resolver.mac = data.mac;
  
        // Save Nickname
        user.resolver.name = data.name;
  
        // Increase Player Count in Game Node
        game.playercount++;
  
        // Link Game to Player
        user.game = game;
  
        // Notify User
        const ip = user.resolver.ip.toString('utf8');

        // Extract the IPv4 address from the IPv6 representation
        const ipv4Address = ip.replace(/.*:/, '');
        const safegamestr = game.game.data.toString('utf8', 0, PRODUCT_CODE_LENGTH);
        console.log(
          `${user.resolver.name.data.toString('utf8')} (MAC: ${data.mac.data.toString('hex', 0, 6)} - IP: ${ipv4Address}) started playing ${safegamestr}.`
        );
  
        // Update Status Log
        //update_status();
  
        // Leave Function
        return;
      }
    } else {
        // Notify User
        const ip = user.resolver.ip;
        console.log(`Invalid Login Packet Contents from ${ip[0]}.${ip[1]}.${ip[2]}.${ip[3]}.`);
      }
    
      // Logout User - Out of Memory or Invalid Arguments
      logout_user(user);
    }

    function gameProductOverride(product) {
        // Safe Product Code
        const productid = product.data.slice(0, PRODUCT_CODE_LENGTH).toString('utf8');
      
        // Database Handle
        const db = new sqlite3.Database(SERVER_DATABASE);
      
        // Crosslinked Flag
        let crosslinked = false;
      
        // Exists Flag
        let exists = false;
      
        // SQL Statements
        const sql = "SELECT id_to FROM crosslinks WHERE id_from=?;";
        const sql2 = "SELECT * FROM productids WHERE id=?;";
        const sql3 = "INSERT INTO productids(id, name) VALUES(?, ?);";
      
        // Execute SQL Statement
        db.serialize(() => {
          // Check for Crosslinks
          db.get(sql, productid, (err, row) => {
            if (!err && row) {
              // Grab Crosslink ID
              const crosslink = row.id_to;
      
              // Crosslink Product Code
              product.data.write(crosslink, 0, PRODUCT_CODE_LENGTH, 'utf8');
      
              // Log Crosslink
              console.log(`Crosslinked ${productid} to ${crosslink}`);
      
              // Set Crosslinked Flag
              crosslinked = true;
            }
          });
      
          // Not Crosslinked
          if (!crosslinked) {
            // Check if the product exists in the database
            db.get(sql2, productid, (err, row) => {
              if (!err && row) {
                // Set Exists Flag
                exists = true;
              }
            });
      
            // Game doesn't exist in Database
            if (!exists) {
              // Save Product ID to Database
              const stmt = db.prepare(sql3);
              stmt.run(productid, productid, (err) => {
                if (!err) {
                  // Log Addition
                  console.log(`Added Unknown Product ID ${productid} to Database.`);
                }
                stmt.finalize();
              });
            }
          }
        });
      
        // Close Database
        db.close();
      }

function get_user_state(user) {
    // Timeout Status
    if ((Date.now() - user.last_recv) >= SERVER_USER_TIMEOUT * 1000) return USER_STATE_TIMED_OUT;
  
    // Waiting Status
    if (user.game === null) return USER_STATE_WAITING;
  
    // Logged-In Status
    return USER_STATE_LOGGED_IN;
  }

  function logout_user(user) {
    // Disconnect from Group
    if (user.group !== null) {
      disconnect_user(user);
    }
  
    // Unlink Leftside (Beginning)
    if (user.prev === null) {
      _db_user = user.next;
    } else {
      user.prev.next = user.next;
    }
  
    // Unlink Rightside
    if (user.next !== null) {
      user.next.prev = user.prev;
    }
  
    // Close Stream (assuming 'socket' is used to store the stream reference)
    user.stream.destroy();
  
    // Playing User
    if (user.game !== null) {
      // Notify User
      const ip = [user.resolver.ip >> 24, (user.resolver.ip >> 16) & 0xFF, (user.resolver.ip >> 8) & 0xFF, user.resolver.ip & 0xFF];
      const safegamestr = user.game.game.data.toString('utf8');
      console.log(`${user.resolver.name.data.toString('utf8')} (MAC: ${user.resolver.mac.data.join(':')} - IP: ${ip.join('.')}) stopped playing ${safegamestr}.`);
  
      // Fix Game Player Count
      user.game.playercount--;
  
      // Empty Game Node
      if (user.game.playercount === 0) {
        // Unlink Leftside (Beginning)
        if (user.game.prev === null) {
          _db_game = user.game.next;
        } else {
          user.game.prev.next = user.game.next;
        }
  
        // Unlink Rightside
        if (user.game.next !== null) {
          user.game.next.prev = user.game.prev;
        }
  
        // Free Game Node Memory
        // Note: Assuming user.game is an object with game property
        user.game = null;
      }
    } else {
      // Unidentified User
      // Notify User
      const ip = [user.resolver.ip >> 24, (user.resolver.ip >> 16) & 0xFF, (user.resolver.ip >> 8) & 0xFF, user.resolver.ip & 0xFF];
      console.log(`Dropped Connection to ${ip.join('.')}.`);
    }
  
    // Fix User Counter
    _db_user_count--;
  
    // Update Status Log (add your logic for update_status)
    updateStatus();
  }

  function connectUser(user, group) {
    // Group Name Check
    let validGroupName = true;
  
    for (let i = 0; i < ADHOCCTL_GROUPNAME_LEN && validGroupName; i++) {
      if (group.data[i] === 0) break;
      if (
        (group.data[i] < 'A' || group.data[i] > 'Z') &&
        (group.data[i] < 'a' || group.data[i] > 'z') &&
        (group.data[i] < '0' || group.data[i] > '9')
      ) {
        validGroupName = false;
      }
    }
  
    // Valid Group Name
    if (validGroupName) {
      // User is disconnected
      if (user.group === null) {
        // Find Group in Game Node
        let g = user.game.group;
        while (g !== null && g.group.data !== group.data) g = g.next;
  
        // BSSID Packet
        const bssid = new SceNetAdhocctlConnectBSSIDPacketS2C();
  
        // Set BSSID Opcode
        bssid.base.opcode = OPCODE_CONNECT_BSSID;
  
        // Set Default BSSID
        bssid.mac = user.resolver.mac;
  
        // No Group found
        if (g === null) {
          // Allocate Group Memory
          g = new SceNetAdhocctlGroupNode();
  
          // Initialize Game Node
          g.initializeGameNode();
  
          // Link Game Node
          g.game = user.game;
  
          // Link Group Node
          g.next = g.game.group;
          if (g.game.group !== null) g.game.group.prev = g;
          g.game.group = g;
  
          // Copy Group Name
          g.group = group;
  
          // Increase Group Counter for Game
          g.game.groupcount++;
        }
  
        // Group now available
        if (g !== null) {
          // Iterate remaining Group Players
          let peer = g.player;
          while (peer !== null) {
            // Connect Packet
            const packet = new SceNetAdhocctlConnectPacketS2C();
  
            // Set Connect Opcode
            packet.base.opcode = OPCODE_CONNECT;
  
            // Set Player Name
            packet.name = user.resolver.name.data;
  
            // Set Player MAC
            packet.mac = user.resolver.mac.data;
  
            // Set Player IP
            packet.ip = Buffer.from(user.resolver.ip, 'utf8');
            console.log(packet);
            // Send Data
            user.stream.write(peer.stream, packet, 137, 0);
  
            // Set Player Name
            packet.name = peer.resolver.name;
  
            // Set Player MAC
            packet.mac = peer.resolver.mac;
  
            // Set Player IP
            packet.ip = peer.resolver.ip;
  
            // Send Data
            user.stream.write(user.stream, packet, 137, 0);
  
            // Set BSSID
            if (peer.group_next === null) bssid.mac = peer.resolver.mac;
  
            // Move Pointer
            peer = peer.group_next;
          }
  
          // Link User to Group
          user.group_next = g.player;
          if (g.player !== null) g.player.group_prev = user;
          g.player = user;
  
          // Link Group to User
          user.group = g;
  
          // Increase Player Count
          g.playercount++;
  
          // Send Network BSSID to User
          user.stream.write(user.stream, bssid, 9, 0);
  
          // Notify User
          const ip = new Uint8Array(user.resolver.ip);
          const safegamestr = user.game.game.data.slice(0, PRODUCT_CODE_LENGTH);
          const safegroupstr = g.group.data.slice(0, ADHOCCTL_GROUPNAME_LEN);
          console.log(
            `${user.resolver.name.data} (MAC: ${user.resolver.mac.data.join(
              ':'
            )} - IP: ${ip.join('.')}) joined ${safegamestr} group ${safegroupstr}.`
          );
  
          // Update Status Log
          updateStatus();
  
          // Exit Function
          return;
        }
      }
      // Already connected to another group
      else {
        // Notify User
        const ip = new Uint8Array(user.resolver.ip);
        const safegamestr = user.game.game.data.slice(0, PRODUCT_CODE_LENGTH);
        const safegroupstr = group.data.slice(0, ADHOCCTL_GROUPNAME_LEN);
        const safegroupstr2 = user.group.group.data.slice(
          0,
          ADHOCCTL_GROUPNAME_LEN
        );
        console.log(
          `${user.resolver.name.data} (MAC: ${user.resolver.mac.data.join(
            ':'
          )} - IP: ${ip.join('.')}) attempted to join ${safegamestr} group ${safegroupstr} without disconnecting from ${safegroupstr2} first.`
        );
      }
    }
    // Invalid Group Name
    else {
      // Notify User
      const ip = new Uint8Array(user.resolver.ip);
      const safegamestr = user.game.game.data.slice(0, PRODUCT_CODE_LENGTH);
      const safegroupstr = group.data.slice(0, ADHOCCTL_GROUPNAME_LEN);
      console.log(
        `${user.resolver.name.data} (MAC: ${user.resolver.mac.data.join(
          ':'
        )} - IP: ${ip.join('.')}) attempted to join invalid ${safegamestr} group ${safegroupstr}.`
      );
    }
  
    // Invalid State, Out of Memory, or Invalid Group Name
    logoutUser(user);
  }
  
  
  module.exports = {
    loginUserData,
    get_user_state,
    logout_user,
    connectUser
  };