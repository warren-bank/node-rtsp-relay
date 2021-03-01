@echo off

rem :: Cyndi Lauper with Blue Angel - I'm Gonna Be Strong (1980)
rem :: https://archive.org/details/cyndi-lauper-with-blue-angel-im-gonna-be-strong-1980
set mp4="https://archive.org/download/cyndi-lauper-with-blue-angel-im-gonna-be-strong-1980/Cyndi Lauper with Blue Angel - I'm Gonna Be Strong.mp4"

set opts=

rem :: reconnect input http stream (if network is unstable)
set opts=%opts% -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 2000 -timeout 2000000000

rem :: read input http stream at native frame rate
set opts=%opts% -re

rem :: read input http stream in a continuous loop
rem ::   IMPORTANT:
rem ::     * versions of ffmpeg older than 4.x don't work quite right
rem ::       - tested with v3.4.1
rem ::         * consumer 'ffplay' plays until the end of the mp4 video, displays black until a timeout occurs, writes a bunch of error messages to stderr, and THEN consumes the next packet which causes playback to loop to the beginning of the mp4 video
rem ::         * consumer 'vlc'    plays until the end of the mp4 video, stops playback
rem ::       - tested with v4.3.2
rem ::         * works perfectly
set opts=%opts% -stream_loop -1

rem :: read input http stream from url to mp4 file, transcode video from h.264 to mpeg-1, use fixed quality (50%)
set opts=%opts% -i %mp4% -c:a copy -c:v mpeg1video -q 15

rem :: produce rtsp stream, connect to relay server at producer port
set opts=%opts% -f rtsp -rtsp_transport udp -muxdelay 0.1 rtsp://127.0.0.1:5554/stream1

ffmpeg %opts%
