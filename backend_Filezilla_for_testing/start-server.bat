@echo off
echo Starting ILOS FileZilla Server...
echo.
echo Server will be available at:
echo - Upload Form: http://localhost:8081/pb-upload
echo - Document Explorer: http://localhost:8081/explorer
echo - Upload API: http://localhost:8081/upload
echo.
echo Press Ctrl+C to stop the server
echo.
node uploadtoftp.js
pause 