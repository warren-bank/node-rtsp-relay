const Dgram = require('dgram');
const Utils = require('./Utils');

const debug_quiet   = Utils.getDebugger('Client', 1)
const debug_verbose = Utils.getDebugger('Client', 2)

const clientPortRegex = /(?:client_port=)(\d*)-(\d*)/;

class Client {
  constructor(mount, req){
    const info      = Utils.getMountInfo(req.uri);
    const portMatch = req.headers.transport.match(clientPortRegex);

    if (mount.path !== info.path) {
      throw new Error('Mount does not equal request provided');
    }
    if (!req.socket.remoteAddress || !req.headers.transport) {
      throw new Error('No remote address found or transport header doesn\'t exist');
    }
    if (!portMatch) {
      throw new Error('Unable to find client ports in transport header');
    }

    this.open            = true;
    this.id              = Utils.getUuid();
    this.mount           = mount;
    this.stream          = mount.streams[info.streamId];
    this.remoteAddress   = req.socket.remoteAddress.replace('::ffff:', ''); //Strip IPv6 thing out
    this.remoteRtpPort   = parseInt(portMatch[1], 10);
    this.remoteRtcpPort  = parseInt(portMatch[2], 10);
    this.rtpServer       = Dgram.createSocket('udp4');
    this.rtcpServer      = Dgram.createSocket('udp4');

    this.setupServerPorts();
  }

  async setup(req){
    let portError = false;

    try {
      await this.listen();
    }
    catch(e) {
      //One or two of the ports was in use, cycle them out and try another
      if(e.errno && e.errno === 'EADDRINUSE'){
        debug_quiet(`Port error on ${e.port}, for stream ${stream.id} using another port`);
        portError = true;

        try{
          await this.rtpServer.close();
          await this.rtcpServer.close();
        }
        catch(e) {
          //Ignore, dont care if couldnt close
          debug_verbose(e);
        }

        if (this.rtpServerPort) {
          this.mount.mounts.returnRtpPortToPool(this.rtpServerPort);
        }

        this.setupServerPorts();
      }
      else{
        throw e;
      }
    }

    if(portError){
      return this.setup(req);
    }

    debug_verbose(
      '%s:%s Client set up for path %s, local ports (%s:%s) remote ports (%s:%s)',
      req.socket.remoteAddress,req.socket.remotePort,
      this.stream.mount.path,
      this.rtpServerPort,this.rtcpServerPort,
      this.remoteRtpPort,this.remoteRtcpPort
    );
  }

  play(){
    this.stream.clients[this.id] = this;
  }

  close(){
    this.open = false;
    this.mount.clientLeave(this);

    return new Promise((resolve) => {
      // Sometimes closing can throw if the dgram has already gone away. Just ignore it.
      try{ this.rtpServer.close();  } catch(e){ debug_verbose('Error closing rtpServer for client',  e); }
      try{ this.rtcpServer.close(); } catch(e){ debug_verbose('Error closing rtcpServer for client', e); }

      if (this.rtpServerPort){
        this.mount.mounts.returnRtpPortToPool(this.rtpServerPort);
      }

      return resolve();
    });
  }

  send_rtp(buf){
    if (this.open === true) {
      this.rtpServer.send(buf, this.remoteRtpPort, this.remoteAddress);
    }
  }

  send_rtcp(buf){
    if (this.open === true) {
      this.rtcpServer.send(buf, this.remoteRtcpPort, this.remoteAddress);
    }
  }

  keepalive(){
    clearTimeout(this.keepaliveTimeout);
    this.keepaliveTimeout = setTimeout(async () => {
      debug_quiet('Client timeout');
      try {
        await this.close();
      }
      catch(e){
        //Ignore
      }
    }, 6e4);
  }

  listen(){
    return new Promise((resolve, reject) => {
      const onError = (err) => {
        return reject(err);
      }

      this.rtpServer.on('error', onError);

      this.rtpServer.bind(this.rtpServerPort, () => {
        this.rtpServer.removeListener('error', onError);

        this.rtcpServer.on('error', onError);
        this.rtcpServer.bind(this.rtcpServerPort, () => {
          this.rtcpServer.removeListener('error', onError);

          return resolve();
        });
      });
    });
  }

  setupServerPorts(){
    const rtpServerPort = this.mount.mounts.getNextRtpPort();
    if (!rtpServerPort) {
      throw new Error('Unable to get next RTP Server Port');
    }

    this.rtpServerPort  = rtpServerPort;
    this.rtcpServerPort = rtpServerPort + 1;
  }
}

module.exports = {Client};
