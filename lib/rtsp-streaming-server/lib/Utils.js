const debug = require('debug');
const {URL} = require('url');
const Uuid  = require('uuid/v4');

const mountRegex = /(\/\S+)[\/](?:streamid|trackid)[=](\d+)/i;

const getMountInfo = (uri) => {
  const urlObj = new URL(uri);

  const mount = {
    path:     urlObj.pathname,
    streamId: -1
  }

  if(mountRegex.test(urlObj.pathname)){
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

const getUuid = () => {
  const buffer = Uuid({}, [])
  return buffer.join('')
}

module.exports = {getMountInfo, getDebugger, getUuid};
