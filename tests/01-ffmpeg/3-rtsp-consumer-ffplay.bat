@echo off

rem :: https://trac.ffmpeg.org/ticket/6891
set SDL_AUDIODRIVER=directsound

ffplay -rtsp_transport udp rtsp://127.0.0.1:6554/stream1
