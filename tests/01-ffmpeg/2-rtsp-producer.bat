@echo off

rem :: Cyndi Lauper with Blue Angel - I'm Gonna Be Strong (1980)
rem :: https://archive.org/details/cyndi-lauper-with-blue-angel-im-gonna-be-strong-1980
set mp4="https://archive.org/download/cyndi-lauper-with-blue-angel-im-gonna-be-strong-1980/Cyndi Lauper with Blue Angel - I'm Gonna Be Strong.mp4"

ffmpeg -re -stream_loop -1 -i %mp4% -c:a copy -c:v mpeg1video -f rtsp -rtsp_transport udp rtsp://127.0.0.1:5554/stream1
