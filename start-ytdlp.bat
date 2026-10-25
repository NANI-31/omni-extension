@echo off
title Omni Extension - yt-dlp Companion Server
cd /d "%~dp0"
echo ========================================================
echo Starting Omni Extension yt-dlp Local Companion Server...
echo ========================================================
node scripts\ytdlp-server.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Companion server encountered an error (Code: %ERRORLEVEL%).
    pause
)
