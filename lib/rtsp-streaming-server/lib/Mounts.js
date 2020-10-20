const {Mount} = require('./Mount');
const Utils   = require('./Utils');

const debug_quiet   = Utils.getDebugger('Mounts', 1)
const debug_verbose = Utils.getDebugger('Mounts', 2)

class Mounts {
  constructor(config){
    this.mounts   = {};
    this.rtpPorts = []; //It is assumed that each start port has a correlating end port of start+1

    for(let i = config.rtpPortStart; i < config.rtpPortStart + config.rtpPortCount; i = i+2){
      this.rtpPorts.push(i);
    }
  }

  getMount(uri){
    let info = Utils.getMountInfo(uri);
    return this.mounts[info.path];
  }

  addMount(uri, sdp, hooks){
    debug_verbose('Adding mount with path %s and SDP %O', uri, sdp);

    const info  = Utils.getMountInfo(uri);
    const mount = new Mount(this, info.path, sdp, hooks);
    this.mounts[info.path] = mount;
    return mount;
  }

  getNextRtpPort(){
    debug_verbose('%d rtp ports remaining', this.rtpPorts.length - 1);

    return this.rtpPorts.shift();
  }

  returnRtpPortToPool(port){
    debug_verbose('%d rtp ports remaining', this.rtpPorts.length + 1);

    this.rtpPorts.push(port);
  }

  deleteMount(uri){
    debug_verbose('Removing mount with path %s', uri);

    const info  = Utils.getMountInfo(uri);
    const mount = this.mounts[info.path];

    if (mount){
      const portsFreed = mount.close();

      this.rtpPorts = this.rtpPorts.concat(portsFreed);
      this.mounts[info.path] = null;
      delete this.mounts[info.path];
      return true;
    }

    return false;
  }
}

module.exports = {Mounts};
