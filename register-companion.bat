@echo off
setlocal EnableDelayedExpansion
title Register Omni Extension Native Companion

echo ========================================================
echo    Omni Extension - Native Companion Auto-Register
echo ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
:: Remove trailing backslash
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

set "HOST_EXE=%SCRIPT_DIR%\scripts\native-host.exe"
set "MANIFEST_JSON=%SCRIPT_DIR%\scripts\com.omni.ytdlp.json"
set "SILENT_VBS=%SCRIPT_DIR%\scripts\silent-start.vbs"

:: Compile windowless native-host.exe if missing
if not exist "%HOST_EXE%" (
  echo Compiling windowless native-host.exe...
  C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /optimize /out:"%HOST_EXE%" "%SCRIPT_DIR%\scripts\native-host.cs" >nul 2>&1
)

:: Escape backslashes for JSON
set "ESCAPED_EXE=%HOST_EXE:\=\\%"

echo [1/3] Generating Chrome Native Messaging manifest...
(
  echo {
  echo   "name": "com.omni.ytdlp",
  echo   "description": "Omni Extension Companion Host",
  echo   "path": "!ESCAPED_EXE!",
  echo   "type": "stdio",
  echo   "allowed_origins": [
  echo     "chrome-extension://gkenceapffdabffmeoogmcelljacppie/",
  echo     "chrome-extension://dphleochackolcpjpcbjlmibjmjmeojf/",
  echo     "chrome-extension://ceoolinilmfkbhldkafagejmanddbecf/"
  echo   ]
  echo }
) > "%MANIFEST_JSON%"

echo       Created: %MANIFEST_JSON%
echo.

echo [2/3] Registering Chrome and Edge Native Messaging Hosts...
reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.omni.ytdlp" /ve /t REG_SZ /d "%MANIFEST_JSON%" /f >nul
if %ERRORLEVEL% EQU 0 (
  echo       [OK] Registered for Google Chrome
) else (
  echo       [WARNING] Could not write Chrome registry key.
)

reg add "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.omni.ytdlp" /ve /t REG_SZ /d "%MANIFEST_JSON%" /f >nul
if %ERRORLEVEL% EQU 0 (
  echo       [OK] Registered for Microsoft Edge
)

echo.
echo [3/3] Registering 'omni-ytdlp://' URL protocol handler fallback...
reg add "HKCU\Software\Classes\omni-ytdlp" /ve /t REG_SZ /d "URL:Omni Extension yt-dlp Companion" /f >nul
reg add "HKCU\Software\Classes\omni-ytdlp" /v "URL Protocol" /t REG_SZ /d "" /f >nul
reg add "HKCU\Software\Classes\omni-ytdlp\shell\open\command" /ve /t REG_SZ /d "wscript.exe \"%SILENT_VBS%\"" /f >nul
echo       [OK] Registered URL protocol omni-ytdlp://

echo.
echo ========================================================
echo [SUCCESS] Omni Extension Native Host Registered!
echo The extension can now start the companion server automatically.
echo ========================================================
echo.
pause
