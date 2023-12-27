const { SceNetAdhocctlGroupName, SceNetAdhocctlNickname, SceNetEtherAddr } = require('./pspstruct');

// Packets
const OPCODE_PING = 0;
const OPCODE_LOGIN = 1;
const OPCODE_CONNECT = 2;
const OPCODE_DISCONNECT = 3;
const OPCODE_SCAN = 4;
const OPCODE_SCAN_COMPLETE = 5;
const OPCODE_CONNECT_BSSID = 6;
const OPCODE_CHAT = 7;

// PSP Product Code
const PRODUCT_CODE_LENGTH = 9;
class SceNetAdhocctlProductCode {
  constructor() {
    this.data = Buffer.alloc(PRODUCT_CODE_LENGTH);
  }
}

// Basic Packet
class SceNetAdhocctlPacketBase {
  constructor(opcode) {
    this.opcode = opcode;
  }
}

// C2S Login Packet
class SceNetAdhocctlLoginPacketC2S {
  constructor() {
    this.base = new SceNetAdhocctlPacketBase(OPCODE_LOGIN);
    this.mac = new SceNetEtherAddr();
    this.name = new SceNetAdhocctlNickname();
    this.game = new SceNetAdhocctlProductCode();
  }
  static get length() {
    // Adjust this based on the actual structure size
    return 144/* some valid length */;
  }
}

// C2S Connect Packet
class SceNetAdhocctlConnectPacketC2S {
  constructor() {
    this.base = new SceNetAdhocctlPacketBase(OPCODE_CONNECT);
    this.group = new SceNetAdhocctlGroupName();
  }

  static get length() {
    // Adjust this based on the actual structure size
    return 9/* some valid length */;
  }
}

// C2S Chat Packet
class SceNetAdhocctlChatPacketC2S {
  constructor(message) {
    this.base = new SceNetAdhocctlPacketBase(OPCODE_CHAT);
    this.message = message;
  }
}

// S2C Connect Packet
class SceNetAdhocctlConnectPacketS2C {
  constructor() {
    this.base = new SceNetAdhocctlPacketBase();
    this.name = new SceNetAdhocctlNickname();
    this.mac = new SceNetEtherAddr();
    this.ip = 0;
  }
}

// S2C Disconnect Packet
class SceNetAdhocctlDisconnectPacketS2C {
  constructor() {
    this.base = new SceNetAdhocctlPacketBase(OPCODE_DISCONNECT);
    this.ip = 0;
  }
}

// S2C Scan Packet
class SceNetAdhocctlScanPacketS2C {
  constructor() {
    this.base = new SceNetAdhocctlPacketBase(OPCODE_SCAN);
    this.group = new SceNetAdhocctlGroupName();
    this.mac = new SceNetEtherAddr();
  }
}

// S2C Connect BSSID Packet
class SceNetAdhocctlConnectBSSIDPacketS2C {
  constructor() {
    this.base = new SceNetAdhocctlPacketBase(OPCODE_CONNECT_BSSID);
    this.mac = new SceNetEtherAddr();
  }
}

// S2C Chat Packet
class SceNetAdhocctlChatPacketS2C {
  constructor(message) {
    this.base = new SceNetAdhocctlChatPacketC2S(message);
    this.name = new SceNetAdhocctlNickname();
  }
}

module.exports = {
  OPCODE_PING,
  OPCODE_LOGIN,
  OPCODE_CONNECT,
  OPCODE_DISCONNECT,
  OPCODE_SCAN,
  OPCODE_SCAN_COMPLETE,
  OPCODE_CONNECT_BSSID,
  OPCODE_CHAT,
  PRODUCT_CODE_LENGTH,
  SceNetAdhocctlProductCode,
  SceNetAdhocctlPacketBase,
  SceNetAdhocctlLoginPacketC2S,
  SceNetAdhocctlConnectPacketC2S,
  SceNetAdhocctlChatPacketC2S,
  SceNetAdhocctlConnectPacketS2C,
  SceNetAdhocctlDisconnectPacketS2C,
  SceNetAdhocctlScanPacketS2C,
  SceNetAdhocctlConnectBSSIDPacketS2C,
  SceNetAdhocctlChatPacketS2C,
};
