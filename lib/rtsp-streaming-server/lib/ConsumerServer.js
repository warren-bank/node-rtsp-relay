const auth            = require('basic-auth');
const Rtsp            = require('rtsp-server');
const {ClientWrapper} = require('./ClientWrapper');
const Utils           = require('./Utils');

const debug_quiet   = Utils.getDebugger('ConsumerServer', 1)
const debug_verbose = Utils.getDebugger('ConsumerServer', 2)

class ConsumerServer {
  constructor(rtspPort, mounts, hooks){
    this.rtspPort = rtspPort;
    this.mounts   = mounts;
    this.hooks    = Object.assign({}, hooks)
    this.clients  = {};

    this.server = Rtsp.createServer((req, res) => {
      debug_verbose('%s:%s request: %s', req.socket.remoteAddress, req.socket.remotePort, req.method);

      switch (req.method) {
        case 'DESCRIBE':
          return this.describeRequest(req, res);
        case 'OPTIONS':
          return this.optionsRequest(req, res);
        case 'SETUP':
          return this.setupRequest(req, res);
        case 'PLAY':
          return this.playRequest(req, res);
        case 'TEARDOWN':
          return this.teardownRequest(req, res);
        default:
          debug_verbose('Unknown ConsumerServer request', { method: req.method, url: req.url });
          res.statusCode = 501; // Not implemented
          return res.end();
      }
    });
  }

  start(){
    return new Promise((resolve, reject) => {
      this.server.on('close', () => {
        resolve();
      })

      this.server.listen(this.rtspPort, () => {
        debug_quiet('RTSP consumer server is running on port:', this.rtspPort);
      });
    });
  }

  async optionsRequest(req, res){
    // Update the client timeout if they provide a session
    if(req.headers.session && await this.checkAuthenticated(req, res)){
      const client = this.clients[req.headers.session];
      if (client){
        client.keepalive();
      }
      else {
        res.statusCode = 454; // Session not found
        return res.end();
      }
    }

    res.setHeader('OPTIONS', 'DESCRIBE SETUP PLAY STOP');
    return res.end();
  }

  async describeRequest(req, res){
    if(!await this.checkAuthenticated(req, res)){
      return res.end();
    }

    // Hook to set up the mount with a server if required before the client hits it
    // It'll fall through to a 404 regardless
    if (this.hooks.checkMount) {
      const allowed = await this.hooks.checkMount(req);
      if (!allowed || typeof allowed === 'number') {
        debug_verbose('%s:%s path not allowed by hook - hook returned: %s', req.socket.remoteAddress, req.socket.remotePort, req.uri, allowed);

        res.statusCode = (typeof allowed === 'number') ? allowed : 403;
        return res.end();
      }
    }

    const mount = this.mounts.getMount(req.uri);

    if(!mount){
      debug_verbose('%s:%s - Mount not found, sending 404: %o', req.socket.remoteAddress, req.socket.remotePort, req.uri);

      res.statusCode = 404;
      return res.end();
    }

    res.setHeader('Content-Type',  'application/sdp');
    res.setHeader('Content-Length', Buffer.byteLength(mount.sdp));

    res.write(mount.sdp);
    return res.end();
  }

  async setupRequest(req, res){
    if(!await this.checkAuthenticated(req, res)){
      return res.end();
    }

    //TCP not supported (yet ;-))
    if(req.headers.transport && (req.headers.transport.toLowerCase().indexOf('tcp') > -1)){
      debug_verbose('%s:%s - we dont support tcp, sending 504: %o', req.socket.remoteAddress, req.socket.remotePort, req.uri);

      res.statusCode = 504;
      return res.end();
    }

    let clientWrapper;
    if (!req.headers.session) {
      try {
        clientWrapper = new ClientWrapper(this, req);
        this.clients[clientWrapper.id] = clientWrapper;
      }
      catch(e) {
        debug_verbose('%s:%s - Mount not found, sending 404: %o', req.socket.remoteAddress, req.socket.remotePort, req.uri);

        res.statusCode = 404;
        return res.end();
      }
    }
    else if (this.clients[req.headers.session]) {
      clientWrapper = this.clients[req.headers.session];
    }
    else {
      return; // This theoretically never reaches
    }

    const client = clientWrapper.addClient(req);

    try {
      await client.setup(req);
    }
    catch(e) {
      debug_verbose('Error setting up client', e);
      res.statusCode = 500;
      return res.end();
    }

    res.setHeader('Session',   `${clientWrapper.id};timeout=30`);
    res.setHeader('Transport', `${req.headers.transport};server_port=${client.rtpServerPort}-${client.rtcpServerPort}`);
    return res.end();
  }

  async playRequest(req, res){
    if(!await this.checkAuthenticated(req, res)){
      return res.end();
    }

    if(!req.headers.session || !this.clients[req.headers.session]){
      debug_verbose('%s:%s - session not valid (%s), sending 454: %o', req.socket.remoteAddress, req.socket.remotePort, req.headers.session, req.uri);

      res.statusCode = 454;
      return res.end();
    }
    debug_verbose('%s calling play', req.headers.session);

    const client = this.clients[req.headers.session];
    client.play();

    if(client.mount.range){
      res.setHeader('Range', client.mount.range);
    }

    return res.end();
  }

  async teardownRequest(req, res){
    if(!await this.checkAuthenticated(req, res)){
      return res.end();
    }

    if(!req.headers.session || !this.clients[req.headers.session]){
      debug_verbose('%s:%s - session not valid (%s), sending 454: %o', req.socket.remoteAddress, req.socket.remotePort, req.headers.session, req.uri);

      res.statusCode = 454;
      return res.end();
    }
    debug_verbose('%s:%s tearing down client', req.socket.remoteAddress, req.socket.remotePort);

    const client = this.clients[req.headers.session];
    client.close();

    return res.end();
  }

  async clientGone(clientId){
    if(this.hooks.clientClose) {
      await this.hooks.clientClose(this.clients[clientId].mount);
    }
    debug_verbose('ClientWrapper %s gone', clientId);

    delete this.clients[clientId];
  }

  async checkAuthenticated(req, res){
    // Ask for authentication
    if(this.hooks.authentication){
      if(!req.headers.authorization){
        debug_verbose('%s:%s - No authentication information (required), sending 401', req.socket.remoteAddress, req.socket.remotePort);

        res.setHeader('WWW-Authenticate', 'Basic realm="rtsp"');
        res.statusCode = 401;
        return false;
      }
      else{
        if(req.headers.session && this.clients[req.headers.session] && (this.clients[req.headers.session].authorizationHeader !== req.headers.authorization)){
          debug_verbose('%s:%s - session header doesn\'t match the cached value, sending 401', req.socket.remoteAddress, req.socket.remotePort);

          res.setHeader('WWW-Authenticate', 'Basic realm="rtsp"');
          res.statusCode = 401;
          return false;
        }

        const result = auth.parse(req.headers.authorization);
        if (!result) {
          debug_verbose('%s:%s - No authentication information (required), sending 401', req.socket.remoteAddress, req.socket.remotePort);

          res.setHeader('WWW-Authenticate', 'Basic realm="rtsp"');
          res.statusCode = 401;
          return false;
        }

        const allowed = await this.hooks.authentication(result.name, result.pass, req, res);
        if (!allowed) {
          debug_verbose('%s:%s - No authentication information (hook returned false), sending 401', req.socket.remoteAddress, req.socket.remotePort);

          res.setHeader('WWW-Authenticate', 'Basic realm="rtsp"');
          res.statusCode = 401;
          return false;
        }
      }
    }

    return true;
  }
}

module.exports = {ConsumerServer};
