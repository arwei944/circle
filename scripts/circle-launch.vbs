' Circle launcher - opens standalone app window with zero console flash.
' Called via wscript.exe (no console host), launches two hidden PowerShell
' jobs in parallel:
'   1) ensure the server is running (hidden)  2) open the app window once ready.

Dim shell
Set shell = CreateObject("WScript.Shell")

scriptDir = "C:\work\test\circle\scripts"

cmdEnsure = "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & scriptDir & "\ensure-server.ps1"""
cmdOpen   = "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & scriptDir & "\open-app-window.ps1"""

' window style 0 = hidden; bWaitOnReturn = False
Call shell.Run(cmdEnsure, 0, False)
Call shell.Run(cmdOpen, 0, False)