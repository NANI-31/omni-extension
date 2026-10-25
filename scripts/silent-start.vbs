' Silent launcher for Omni Extension yt-dlp companion
Set WshShell = CreateObject("WScript.Shell")
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
serverPath = scriptDir & "\ytdlp-server.js"
WshShell.Run "node """ & serverPath & """", 0, False
