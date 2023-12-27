const net = require('net');
const packets = require('./packets');
let { _db_user, _db_game, _db_user_count, USER_STATE_WAITING, USER_STATE_TIMED_OUT,USER_STATE_LOGGED_IN, SceNetAdhocctlUserNode, SceNetAdhocctlGroupNode } = require('./userh.js');
const { loginUserData, get_user_state, connectUser } = require('./utility_Functions.js');

const userDatabase = {
  head: null,
  tail: null,
};

const server = net.createServer((socket) => {
  console.log('Client connected');
  
  const user = new SceNetAdhocctlUserNode();
  user.stream = socket;

  // Handle incoming data
  socket.on('data', (data) => {
    try {
      data.copy(user.rx, user.rxpos);

      // Update 'rxpos' to point to the next available position in the buffer
      user.rxpos += data.length;

      // Parse the incoming data based on the packet structure
      //const packet = parsePacket(data);
      // Handle different packet types
      switch (user.rx[0]) {
        case packets.OPCODE_PING:
          handlePingPacket(data,user);
          break;
        case packets.OPCODE_LOGIN:
          handleLoginPacket(data, user);
          break;
        case packets.OPCODE_CONNECT:
          handleConnectPacket(data, user);
          break;
        case packets.OPCODE_DISCONNECT:
          handleDisconnectPacket(data, user);
          break;
        case packets.OPCODE_SCAN:
          handleScanPacket(data);
          break;
        case packets.OPCODE_CHAT:
          handleChatPacket(data);
          break;
        default:
          console.log('Unknown packet opcode:', user.rx[0]);
      }
    } catch (error) {
      console.error('Error processing packet:', error);
    }
  });

  // Handle client disconnection
  socket.on('end', () => {
    console.log('Client disconnected');
    removeFromUserDatabase(user);
  });

  addToUserDatabase(user);
});

// Start the server
const PORT = 27312;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Function to parse incoming data into a packet
function parsePacket(data) {
  //console.log(data);
  data.copy(user.rx, user.rxpos);

      // Update 'rxpos' to point to the next available position in the buffer
      user.rxpos += data.length;

  // Return the parsed packet
  return {
    base: {
      opcode,
    },
    data: packetData,
  };
}

// Example functions to handle different packet types
function handlePingPacket(packet,user) {
  //console.log('Handling PING packet' + packet);
  user.rx = Buffer.from(user.rx.slice(1));

  // Update 'rxpos' accordingly
  user.rxpos -= 1;
  // Implement logic for handling PING packets
}

function handleLoginPacket(data, user) {
  console.log('Handling LOGIN packet');

  // Assume SceNetAdhocctlLoginPacketC2S is a class in packets module
  const loginPacketLength = packets.SceNetAdhocctlLoginPacketC2S.length;

  if (user.rxpos >= loginPacketLength) {
    // Clone Packet
    const loginPacket = new packets.SceNetAdhocctlLoginPacketC2S();

    loginPacket.base.opcode = data.readUInt8(0);
    loginPacket.mac.data = Buffer.from(data.slice(1, 7));
    loginPacket.name.data = Buffer.from(data.slice(7, 135));
    loginPacket.game.data.set(data.slice(135, 144));

    const ipAddress = user.stream.remoteAddress;

    // Update the user's resolver with the IP address
    user.resolver.ip = ipAddress;

    // Remove Packet from RX Buffer
    user.rx = user.rx.slice(loginPacketLength);
    user.rxpos -= loginPacketLength;

    // Login User (Data)
    //console.log(user.rxpos + ' login packet: ' + loginPacket.toString());
    loginUserData(user, loginPacket);
  }
  // Implement logic for handling LOGIN packets
}

function handleConnectPacket(packet, user) {
  console.log('Handling CONNECT packet');
  // Implement logic for handling CONNECT packets
  const CONNECT_PACKET_LENGTH = packets.SceNetAdhocctlConnectPacketC2S.length;
  if (user.rxpos >= CONNECT_PACKET_LENGTH) {
    // Create a buffer with the CONNECT packet data
    const connectPacket = Buffer.alloc(CONNECT_PACKET_LENGTH);
    user.rx.copy(connectPacket, 0, 0, CONNECT_PACKET_LENGTH);

  const g = new SceNetAdhocctlGroupNode();
  
          // Initialize Game Node
          g.initializeGameNode();

    // Clear the packet from the RX buffer
    user.rx = user.rx.slice(CONNECT_PACKET_LENGTH);
    user.rxpos -= CONNECT_PACKET_LENGTH;

    // Extract the group name from the connect packet
    //const groupName = connectPacket.slice(/* offset */, /* length */);
console.log(packet);
    // Connect the user to the group
    //connectUser(user, g);
  }
}

function handleDisconnectPacket(packet) {
  console.log('Handling DISCONNECT packet');
  // Implement logic for handling DISCONNECT packets
  const recvResult = get_user_state(user);
  if (
    recvResult === 0 ||
    (recvResult === -1 && errno !== 'EAGAIN' && errno !== 'EWOULDBLOCK') ||
    get_user_state(user) === USER_STATE_TIMED_OUT
  ) {
    // Logout User
    logoutUser(user);
  }
}

function handleScanPacket(packet) {
  console.log('Handling SCAN packet');
  // Implement logic for handling SCAN packets
}

function handleChatPacket(packet) {
  console.log('Handling CHAT packet');
  // Implement logic for handling CHAT packets
}

// Function to add a user to the user database
function addToUserDatabase(user) {
  if (!userDatabase.head) {
    // If the user database is empty, set the new user as both head and tail
    userDatabase.head = user;
    userDatabase.tail = user;
  } else {
    // Otherwise, add the new user to the end of the list
    user.prev = userDatabase.tail;
    userDatabase.tail.next = user;
    userDatabase.tail = user;
  }
}

// Function to remove a user from the user database
function removeFromUserDatabase(user) {
  if (user.prev) {
    user.prev.next = user.next;
  } else {
    // If the user is the head, update the head
    userDatabase.head = user.next;
  }

  if (user.next) {
    user.next.prev = user.prev;
  } else {
    // If the user is the tail, update the tail
    userDatabase.tail = user.prev;
  }
}