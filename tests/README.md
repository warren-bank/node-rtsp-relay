### [rtsp-relay: tests](https://github.com/warren-bank/node-rtsp-relay/tree/master/tests)

#### setup

```bash
cd tests
npm install
```

#### 01-ffmpeg

1. [start the rtsp relay server](https://github.com/warren-bank/node-rtsp-relay/blob/master/tests/01-ffmpeg/1-rtsp-relay.bat)
   - listens for producers at port: 5554
   - listens for consumers at port: 6554
2. [start a rtsp producer, and connect to relay at port 5554](https://github.com/warren-bank/node-rtsp-relay/blob/master/tests/01-ffmpeg/2-rtsp-producer.bat)
   - application: `ffmpeg`
   - reads mp4 file from network url
     * channels:
       - audio: `aac` is copied
       - video: `h.264` is transcoded to `mpeg1video`
     * content: [Cyndi Lauper with Blue Angel - I'm Gonna Be Strong (1980)](https://archive.org/details/cyndi-lauper-with-blue-angel-im-gonna-be-strong-1980)
3. [start a rtsp consumer, and connect to relay at port 6554](https://github.com/warren-bank/node-rtsp-relay/blob/master/tests/01-ffmpeg/3-rtsp-consumer-ffplay.bat)
   - application: `ffplay`
4. [start a rtsp consumer, and connect to relay at port 6554](https://github.com/warren-bank/node-rtsp-relay/blob/master/tests/01-ffmpeg/4-rtsp-consumer-vlc.bat)
   - application: `vlc`
