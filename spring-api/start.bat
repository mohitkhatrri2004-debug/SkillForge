@echo off
REM ── SkillForge Spring Boot Startup Script ──────────────────────
REM Uses JDK 26 (on PATH) which has correct TLS support for MongoDB Atlas.
REM Reads MONGODB_URI from server/.env automatically.

set JAVA_HOME=C:\Program Files\Java\jdk-26.0.2
set PATH=C:\tools\apache-maven-3.9.9\bin;%JAVA_HOME%\bin;%PATH%

REM ── Read MONGODB_URI from server/.env ──────────────────────────
for /f "usebackq tokens=1* delims==" %%A in ("..\server\.env") do (
    if "%%A"=="MONGODB_URI" set MONGODB_URI=%%B
)

if "%MONGODB_URI%"=="" (
    echo ERROR: MONGODB_URI not found in server/.env
    pause
    exit /b 1
)

echo [start] JAVA_HOME=%JAVA_HOME%
echo [start] MONGODB_URI loaded from server/.env
mvn spring-boot:run
