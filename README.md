### [rtsp-relay](https://github.com/warren-bank/node-rtsp-relay)

Node.js server to relay RTSP video stream from 'producer' to 'consumer' client endpoint.

#### The Problem:

* I was looking at Android apps that stream video
  - of the display screen
  - from the camera/microphone
* surprisingly, there are very few good options
* of those:
  - there are none that run a server to allow a client to directly connect and view the stream
  - the only stream protocol they support is RTSP
    * I'm no expert, but apparently:
      - this protocol requires the app to connect (as a client) to an external media server
      - the video stream is pushed to the server
      - clients must connect to the server to view the stream

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
    [optional] If 'producer' requires authentication, provide 'username'.

"-pp" <password>
"--producer-password" <password>
    [optional] If 'producer' requires authentication, provide 'password'.

"-cport" <integer>
"--client-port" <integer>
"--consumer-port" <integer>
    [optional] Port number for RTSP server to which the 'consumer' connects.
    Default: 6554

"-cu" <username>
"--client-username" <username>
"--consumer-username" <username>
    [optional] Authenticate 'consumer' with secret 'username'.

"-cp" <password>
"--client-password" <password>
"--consumer-password" <password>
    [optional] Authenticate 'consumer' with secret 'password'.

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
