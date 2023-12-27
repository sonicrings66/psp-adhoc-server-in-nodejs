const { SceNetAdhocctlGroupName, SceNetAdhocctlNickname, SceNetEtherAddr } = require('./pspstruct');
const { SceNetAdhocctlProductCode } = require('./packets');

// User States
const USER_STATE_WAITING = 0;
const USER_STATE_LOGGED_IN = 1;
const USER_STATE_TIMED_OUT = 2;

// PSP Resolver Information
class SceNetAdhocctlResolverInfo {
  constructor() {
    this.mac = new SceNetEtherAddr();
    this.ip = null;
    this.name = new SceNetAdhocctlNickname();
  }
}

// Type Prototypes
class SceNetAdhocctlGameNode {
  constructor() {
    this.game = new SceNetAdhocctlProductCode();
    this.playercount = 0;
    this.groupcount = 0;
    this.group = null; // Will be initialized separately
    this.next = null;
    this.prev = null;
  }

  initializeGroupNode() {
    this.group = new SceNetAdhocctlGroupNode();
  }
}

class SceNetAdhocctlGroupNode {
  constructor() {
    this.next = null;
    this.prev = null;
    this.game = null; // Will be initialized separately
    this.group = new SceNetAdhocctlGroupName();
    this.playercount = 0;
    this.player = new SceNetAdhocctlUserNode();
  }

  initializeGameNode() {
    this.game = new SceNetAdhocctlGameNode();
  }
}

// Double-Linked User List
class SceNetAdhocctlUserNode {
  constructor() {
    this.next = null;
    this.prev = null;
    this.group_next = null;
    this.group_prev = null;
    this.resolver = new SceNetAdhocctlResolverInfo();
    this.game = null; // Will be initialized separately
    this.group = null; // Will be initialized separately
    this.stream = 0;
    this.last_recv = 0;
    this.rx = Buffer.alloc(1024);
    this.rxpos = 0;
  }

  initializeGameAndGroupNodes() {
    this.game = new SceNetAdhocctlGameNode();
    this.group = new SceNetAdhocctlGroupNode();
  }
}

// User Count
let _db_user_count = 0;

// User Database
let _db_user = null;

// Game Database
let _db_game = null;

module.exports = {
  USER_STATE_WAITING,
  USER_STATE_LOGGED_IN,
  USER_STATE_TIMED_OUT,
  SceNetAdhocctlResolverInfo,
  SceNetAdhocctlGameNode,
  SceNetAdhocctlGroupNode,
  SceNetAdhocctlUserNode,
  _db_user_count,
  _db_user,
  _db_game,
};
