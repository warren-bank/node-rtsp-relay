const Uuid     = require('uuid/v4');
const {RtpUdp} = require('./RtpUdp');
const Utils    = require('./Utils');

const debug_quiet   = Utils.getDebugger('Mount', 1)
const debug_verbose = Utils.getDebugger('Mount', 2)

class Mount {
  constructor(mounts, path, sdpBody, hooks){
    this.id           = Uuid();
    this.mounts       = mounts;
    this.path         = path;
    this.streams      = {};
    this.hooks        = hooks;
    this.sdp          = sdpBody;
    this.range        = undefined;

    debug_quiet('Set up mount at path %s', path);
  }

  createStream(uri){
    const info     = Utils.getMountInfo(uri);
    const nextPort = this.mounts.getNextRtpPort();

    if (!nextPort) {
      throw new Error('No ports available to create the stream');
    }

    debug_quiet('Setting up stream %s on path %s', info.streamId, info.path);

    this.streams[info.streamId] = {
      clients:      {},
      id:           info.streamId,
      mount:        this,
      rtpStartPort: nextPort,     //RTP
      rtpEndPort:  (nextPort + 1) //RTCP
    };

    return this.streams[info.streamId];
  }

  setRange(range){
    this.range = range;
  }

  async setup(){
    let portError = false;

    for(let id in this.streams){
      const stream = this.streams[id];

      stream.listenerRtp  = new RtpUdp(stream.rtpStartPort, stream); //RTP
      stream.listenerRtcp = new RtpUdp(stream.rtpEndPort,   stream); //RTCP

      try {
        await stream.listenerRtp.listen();
        await stream.listenerRtcp.listen();
      }
      catch(e) {
        //One or two of the ports was in use, cycle them out and try another
        if(e.errno && e.errno === 'EADDRINUSE'){
          debug_quiet(`Port error on ${e.port}, for stream ${stream.id} using another port`);
          portError = true;

          try{
            await stream.listenerRtp.close();
            await stream.listenerRtcp.close();
          } catch(e) {
            //Ignore, dont care if couldnt close
            debug_verbose(e);
          }

          this.mounts.returnRtpPortToPool(stream.rtpStartPort);

          const nextStartPort = this.mounts.getNextRtpPort();
          if (!nextStartPort) {
            throw new Error('Unable to get another start port');
          }

          stream.rtpStartPort = nextStartPort;
          stream.rtpEndPort   = stream.rtpEndPort + 1;
          break;
        }

        return e;
      }
    }

    if(portError){
      return this.setup();
    }
  }

  close(){
    const ports = [];

    for(let id in this.streams){
      const stream = this.streams[id];

      if (stream) {
        for (let id in stream.clients) {
          const client = stream.clients[id];
          debug_quiet('Closing Client', client.id);
          client.close();
        }

        stream.listenerRtp  && stream.listenerRtp.close();
        stream.listenerRtcp && stream.listenerRtcp.close();
      }

      ports.push(stream.rtpStartPort);
    }

    return ports;
  }

  clientLeave (client) {
    delete this.streams[client.stream.id].clients[client.id];
    let empty = true;
    for (let stream in this.streams) {
      if (Object.keys(this.streams[stream].clients).length > 0) {
        empty = false;
      }
    }

    if (empty && this.hooks && this.hooks.mountNowEmpty) {
      this.hooks.mountNowEmpty(this);
    }
  }
}

module.exports = {Mount};
