// Ethernet Address (MAC)
const ETHER_ADDR_LEN = 6;
class SceNetEtherAddr {
  constructor() {
    this.data = new Uint8Array(ETHER_ADDR_LEN);
  }

  clear() {
    this.data.fill(0);
  }
}

// Adhoc Virtual Network Name (1234ABCD)
const ADHOCCTL_GROUPNAME_LEN = 8;
class SceNetAdhocctlGroupName {
  constructor() {
    this.data = new Uint8Array(ADHOCCTL_GROUPNAME_LEN);
  }
}

// Player Nickname
const ADHOCCTL_NICKNAME_LEN = 128;
class SceNetAdhocctlNickname {
  constructor() {
    this.data = new Uint8Array(ADHOCCTL_NICKNAME_LEN);
  }
}

module.exports = {
  SceNetEtherAddr,
  SceNetAdhocctlGroupName,
  SceNetAdhocctlNickname,
  ADHOCCTL_GROUPNAME_LEN,
  ADHOCCTL_NICKNAME_LEN,
};
