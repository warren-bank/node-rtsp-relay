const {Client} = require('./Client');
const Utils    = require('./Utils');

const debug_quiet   = Utils.getDebugger('ClientWrapper', 1)
const debug_verbose = Utils.getDebugger('ClientWrapper', 2)

class ClientWrapper {
  constructor(clientServer, req){
    const info  = Utils.getMountInfo(req.uri);
    const mount = clientServer.mounts.mounts[info.path];

    if (!mount) {
      throw new Error('Mount does not exist');
    }

    this.id                  = Utils.getUuid();
    this.clientServer        = clientServer;
    this.mount               = mount;
    this.clients             = {};
    this.context             = req.context || {};
    this.authorizationHeader = req.headers.authorization || '';

    debug_verbose('%s - constructed', this.id);
  }

  addClient(req){
    const client = new Client(this.mount, req);
    debug_verbose('%s new client %s', this.id, client.id);

    // Some clients for whatever reason don't send RTSP keepalive requests
    // (Live555 streaming media as an example)
    // RTP spec says compliant clients should be sending rtcp Receive Reports (RR) to show their "liveliness"
    // So we support this as a keepalive too.
    client.rtcpServer.on('message', () => {
      this.keepalive();
    });

    this.clients[client.id] = client;
    return client;
  }

  play(){
    for (let client in this.clients) {
      this.clients[client].play();
    }

    this.keepalive();
  }

  close(){
    if (this.keepaliveTimeout) {
      clearTimeout(this.keepaliveTimeout);
    }

    for (let client in this.clients) {
      this.clients[client].close();
    }

    this.clientServer.clientGone(this.id);
  }

  keepalive(){
    if (this.keepaliveTimeout) {
      clearTimeout(this.keepaliveTimeout);
    }

    this.keepaliveTimeout = setTimeout(async () => {
      debug_verbose('%s client timeout, closing connection', this.id);

      try {
        await this.close();
      }
      catch (e) {
        // Ignore
      }
    }, 6e4); // 60 seconds (double the normal keepalive interval)
  }
}

module.exports = {ClientWrapper};
