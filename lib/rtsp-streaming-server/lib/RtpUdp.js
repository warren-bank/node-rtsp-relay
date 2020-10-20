const Dgram = require('dgram');
const Utils = require('./Utils');

const debug_quiet   = Utils.getDebugger('RtpUdp', 1)
const debug_verbose = Utils.getDebugger('RtpUdp', 2)

class RtpUdp {
  constructor(port, stream){
    this.port   = port;
    this.stream = stream;
    this.type   = (port % 2) ? 'rtcp' : 'rtp';
    this.server = Dgram.createSocket('udp4');

    this.server.on('message', (buf) => {
      for(let id in this.stream.clients){
        const client = this.stream.clients[id];

        //Differenciate rtp and rtcp so that the client object knows which port to send to
        client[`send_${this.type}`](buf);
      }
    });
  }

  listen(){
    return new Promise((resolve, reject) => {
      const onError = (err) => {
        return reject(err);
      }

      this.server.on('error', onError);

      this.server.bind(this.port, () => {
        debug_verbose('Opened %s listener for stream %s on path %s', this.type.toUpperCase(), this.stream.id, this.stream.mount.path);

        this.server.removeListener('error', onError);
        return resolve();
      });
    });
  }

  close(){
    return new Promise((resolve, reject) => {
      debug_verbose('Closing UDP listeners for stream %s', this.stream.id);

      this.server.close(() => {
        return resolve();
      });
    });
  }
}

module.exports = {RtpUdp};
