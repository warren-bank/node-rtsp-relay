const debug = require('debug');
const {URL} = require('url');

const mountRegex = /(\/\S+)(?:\/streamid=)(\d+)/;

const getMountInfo = (uri) => {
  const urlObj = new URL(uri);

  const mount = {
    path:     urlObj.pathname,
    streamId: -1
  }

  if(urlObj.pathname.indexOf('streamid') > -1){
    const match = urlObj.pathname.match(mountRegex);

    if(match){
      mount.path     = match[1];
      mount.streamId = parseInt(match[2], 10);
    }
  }

  return mount;
}

const getDebugger = (tag, level=1) => {
  if (level < 1)
    level = 1

  const name = `rtsp-relay:${level}:${tag}`
  return debug(name)
}

module.exports = {getMountInfo, getDebugger};
