const auth  = require('basic-auth');
const Rtsp  = require('rtsp-server');
const Utils = require('./Utils');

const debug_quiet   = Utils.getDebugger('ProducerServer', 1)
const debug_verbose = Utils.getDebugger('ProducerServer', 2)

class ProducerServer {
  constructor(rtspPort, mounts, hooks){
    this.rtspPort = rtspPort;
    this.mounts   = mounts;
    this.hooks    = Object.assign({}, hooks)

    this.server = Rtsp.createServer((req, res) => {
      switch (req.method) {
        case 'OPTIONS':
          return this.optionsRequest(req, res);
        case 'ANNOUNCE':
          return this.announceRequest(req, res);
        case 'SETUP':
          return this.setupRequest(req, res);
        case 'RECORD':
          return this.recordRequest(req, res);
        case 'TEARDOWN':
          return this.teardownRequest(req, res);
        default:
          debug_verbose('Unknown ProducerServer request', {method: req.method, url: req.url});
          res.statusCode = 501 // Not implemented
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
        debug_quiet('RTSP producer server is running on port:', this.rtspPort);
      });
    });
  }

  optionsRequest(req, res){
    debug_verbose('Options request from %s with headers %o', req.socket.remoteAddress, req.headers);

    res.setHeader('OPTIONS', 'DESCRIBE SETUP ANNOUNCE RECORD');
    return res.end();
  }

  async announceRequest(req, res){
    // Ask for authentication
    if (this.hooks.authentication) {
      if (!req.headers.authorization) {
        debug_verbose('%s:%s - No authentication information (required), sending 401', req.socket.remoteAddress, req.socket.remotePort);

        res.setHeader('WWW-Authenticate', 'Basic realm="rtsp"');
        res.statusCode = 401;
        return res.end();
      }
      else {
        const result = auth.parse(req.headers.authorization);
        if (!result) {
          debug_verbose('%s:%s - Invalid authentication information (required), sending 401', req.socket.remoteAddress, req.socket.remotePort);

          res.setHeader('WWW-Authenticate', 'Basic realm="rtsp"');
          res.statusCode = 401;
          return res.end();
        }

        const allowed = await this.hooks.authentication(result.name, result.pass, req, res);
        if (!allowed) {
          debug_verbose('%s:%s - Invalid authentication information (Hook returned false), sending 401', req.socket.remoteAddress, req.socket.remotePort);

          res.setHeader('WWW-Authenticate', 'Basic realm="rtsp"');
          res.statusCode = 401;
          return res.end();
        }

        this.authenticatedHeader = req.headers.authorization;
      }
    }
    debug_verbose('%s:%s - Announce request with headers %o', req.socket.remoteAddress, req.socket.remotePort, req.headers);

    let sdpBody = '';
    req.on('data', (buf) => {
      sdpBody += buf.toString();
    });

    req.on('end', async () => {
      // Hook to check if this mount should exist or be allowed to be published
      if(this.hooks.checkMount){
        const allowed = await this.hooks.checkMount(req);
        if(!allowed){
          debug_verbose('%s:%s path not allowed by hook', req.socket.remoteAddress, req.socket.remotePort, req.uri);

          res.statusCode = 403;
          return res.end();
        }
      }

      let mount

      //If already exists, reuse
      mount = this.mounts.getMount(req.uri);
      if(mount){
        debug_verbose('%s:%s - Mount already existed, reusing session: %s', req.socket.remoteAddress, req.socket.remotePort, mount.id);
      }
      else {
        mount = this.mounts.addMount(req.uri, sdpBody, this.hooks);
        debug_verbose('%s:%s - Set session to %s', req.socket.remoteAddress, req.socket.remotePort, mount.id);
      }

      res.setHeader('Session', `${mount.id};timeout=30`);
      return res.end();
    });
  }

  setupRequest(req, res){
    // Authentication check
    if(!this.checkAuthenticated(req, res)){
      return;
    }

    const mount = this.mounts.getMount(req.uri);
    if (!mount) {
      debug_verbose('%s:%s - No mount with path %s exists', req.socket.remoteAddress, req.socket.remotePort, req.uri);

      res.statusCode = 404; // Unknown stream
      return res.end();
    }

    //TCP not supported (yet ;-))
    if(req.headers.transport && (req.headers.transport.toLowerCase().indexOf('tcp') > -1)){
      debug_verbose('%s:%s - TCP not yet supported - sending 501', req.socket.remoteAddress, req.socket.remotePort, req.uri);

      res.statusCode = 504;
      return res.end();
    }

    const create = mount.createStream(req.uri);
    res.setHeader('Transport', `${req.headers.transport};server_port=${create.rtpStartPort}-${create.rtpEndPort}`);
    return res.end();
  }

  async recordRequest(req, res){
    // Authentication check
    if(!this.checkAuthenticated(req, res)){
      return;
    }

    const mount = this.mounts.getMount(req.uri);

    if (!mount || (mount.id !== req.headers.session)) {
      debug_verbose('%s:%s - No mount with path %s exists, or the session was invalid', req.socket.remoteAddress, req.socket.remotePort, req.uri);

      res.statusCode = 454; // Session Not Found
      return res.end();
    }

    if(req.headers.range){
      mount.setRange(req.headers.range);
    }

    try {
      await mount.setup();
    }
    catch(e){
      debug_verbose('Error setting up record request', e);
      res.statusCode = 500;
    }

    return res.end();
  }

  teardownRequest(req, res){
    // Authentication check
    if(!this.checkAuthenticated(req, res)){
      return;
    }
    debug_verbose('%s:%s - teardown %s', req.socket.remoteAddress, req.socket.remotePort, req.uri);

    this.mounts.deleteMount(req.uri);
    return res.end();
  }

  checkAuthenticated(req, res){
    if (this.hooks.authentication && this.authenticatedHeader) {
      if (req.headers.authorization !== this.authenticatedHeader) {
        debug_verbose('%s:%s - auth header mismatch (401) %O', req.socket.remoteAddress, req.socket.remotePort, req.headers);

        res.statusCode = 401;
        res.end();
        return false;
      }
    }

    return true;
  }
}

module.exports = {ProducerServer};
