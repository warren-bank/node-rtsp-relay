const help = `
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
`

module.exports = help
