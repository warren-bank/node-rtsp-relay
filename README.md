### [rtsp-relay](https://github.com/warren-bank/node-rtsp-relay)

Node.js server to relay RTSP video stream from 'producer' to 'consumer' client endpoint.

#### The Problem:

* I was looking at Android apps that stream video
  - of the display screen
  - from the camera/microphone
* surprisingly, there are very few good options
* the only stream protocol they support is RTSP
  - I'm no expert, but apparently:
    * this protocol requires the app to connect (as a client) to an external media server
    * the video stream is published to the server
    * clients must then connect to this server, in order to subscribe to (and view) the video stream

#### Attempted Workarounds:

* [rtsp-simple-server](https://github.com/aler9/rtsp-simple-server)
  - pros:
    * written in golang, so it cross-compiles statically linked binaries for several platforms
    * small size
    * no dependencies
    * portable
    * simple to use
      - both 'producer' and 'consumer' connect to the same URL: `rtsp://[IP]:8554/[stream_id]`
  - cons:
    * [`v0.10.1`](https://github.com/aler9/rtsp-simple-server/releases/download/v0.10.1/rtsp-simple-server_v0.10.1_windows_amd64.zip) isn't fully compatible with the Android app I was testing: [Larix Screencaster](https://softvelum.com/larix/android/) [`v1.0.29`](https://softvelum.com/mobile/download/LarixScreencaster_1.0.29.apk)
      - it would repeatedly: connect, work a few seconds, disconnect

#### This Workaround:

* based on: [rtsp-streaming-server](https://github.com/chriswiggins/rtsp-streaming-server)
  - written by: [Chris Wiggins](https://github.com/chriswiggins)
  - written in: TypeScript
  - inspired by: [rtsp-server](https://github.com/revmischa/rtsp-server)
    * written by: [Mischa Spiegelmock](https://github.com/revmischa)
    * written in: Perl
* changes:
  - converted from TypeScript to ES6 syntax
    * why:
      - I fkn hate TypeScript
      - now it can run in node without being transpiled
    * how:
      - rebased to [`v1.0.2`](https://github.com/chriswiggins/rtsp-streaming-server/tree/2df32fbba478f23ce74fd70c927d7ddcddb4557f)
      - manually merged subsequent updates
  - added a CLI
* limitations (inherited from [rtsp-streaming-server](https://github.com/chriswiggins/rtsp-streaming-server) library)
  - doesn't support RTP/RTSP/TCP
    * which is:
      - a strategy to interleave the RTP packets into the (TCP) RTSP stream, rather than allocating 2x additional (UDP) RTP and RTCP ports per stream
    * for example:
      - SETUP request from 'producer':
        ```text
          SETUP rtsp://192.168.0.100:5554/screen/streamid=0 RTSP/1.0
          Transport: RTP/AVP/TCP;unicast;interleaved=0-1;mode=record
          User-Agent: Larix/1.0.29
        ```
      - response:
        ```text
          501 Not implemented
        ```
* status:
  - Android 'producer' apps/libraries that have been successfully tested with `rtsp-relay`
    * `libstreaming`
      - library
        * [official source code repo](https://github.com/fyhertz/libstreaming)
      - demo app: `example3`
        * [official source code repo](https://github.com/fyhertz/libstreaming-examples)
        * [unofficial source code repo w/ Android Studio project](https://github.com/warren-bank/Android-libraries/tree/fyhertz/libstreaming-examples)
        * [unofficial prebuilt apks](https://github.com/warren-bank/Android-libraries/releases/tag/fyhertz%2Flibstreaming-examples%2Fv01.00.00) (signed by me)
  - Android 'consumer' apps/libraries that have been successfully tested with `rtsp-relay`
    * `ExoPlayer` pull request [3854](https://github.com/google/ExoPlayer/pull/3854)
      - library
        * [unofficial source code development branch](https://github.com/tresvecesseis/ExoPlayer/tree/dev-v2-rtsp)
      - demo app: `RTSP IPCam Viewer`
        * [source code repo](https://github.com/warren-bank/Android-RTSP-IPCam-Viewer)
        * [prebuilt apks](https://github.com/warren-bank/Android-RTSP-IPCam-Viewer/releases) (signed by me)
  - cross-platform 'consumer' apps/libraries that have been successfully tested with `rtsp-relay`
    * [`VLC`](https://www.videolan.org/vlc/)
      - app
        * [official source code repo](https://github.com/videolan/vlc)

#### Installation:

```bash
npm install --global @warren-bank/rtsp-relay
```

#### CLI Usage:

```bash
rtsp-relay <options>

options:
========
"--help"
    Print a help message describing all command-line options.

"-v"
"--version"
    Display the version.

"-pport" <integer>
"--producer-port" <integer>
    [optional] Port number for RTSP server to which the 'producer' connects.
    Default: 5554

"-pu" <username>
"--producer-username" <username>
    [optional] Authenticate connections to 'producer' port with secret 'username'.

"-pp" <password>
"--producer-password" <password>
    [optional] Authenticate connections to 'producer' port with secret 'password'.

"-cport" <integer>
"--client-port" <integer>
"--consumer-port" <integer>
    [optional] Port number for RTSP server to which the 'consumer' connects.
    Default: 6554

"-cu" <username>
"--client-username" <username>
"--consumer-username" <username>
    [optional] Authenticate connections to 'consumer' port with secret 'username'.

"-cp" <password>
"--client-password" <password>
"--consumer-password" <password>
    [optional] Authenticate connections to 'consumer' port with secret 'password'.

"-rlp" <integer>
"--rtp-low-port" <integer>
    [optional] Low end of UDP port number range for RTP server.
    Default: 10000

"-rhp" <integer>
"--rtp-high-port" <integer>
    [optional] High end of UDP port number range for RTP server.
    Default: 20000

"-L" <integer>
"--log" <integer>
"--log-level" <integer>
    [optional] Enumeration value to specify log output filter.
    Values:
     -1:  custom: obey DEBUG environment variable
      0:  silent
      1:  quiet
      2:  debug quiet
      3:  debug verbose
      4+: verbose
    Default: 1
```

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
