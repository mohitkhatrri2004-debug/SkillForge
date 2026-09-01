@REM ----------------------------------------------------------------------------
@REM Maven Wrapper startup batch script — Windows
@REM
@REM Required ENV vars:
@REM   JAVA_HOME - location of a JDK home dir
@REM
@REM Optional ENV vars:
@REM   MAVEN_OPTS - parameters passed to the Java VM when running Maven
@REM ----------------------------------------------------------------------------

@IF "%__MVNW_ARG0_NAME__%"=="" (SET "BASE_DIR=%~dp0") ELSE (
  SET "BASE_DIR=%%ENV:%__MVNW_ARG0_NAME__%%"
)

@SET MAVEN_PROJECTBASEDIR=%BASE_DIR%
@SET MAVEN_HOME=

@REM -- Find JAVA_HOME -------------------------------------------------------
@IF NOT "%JAVA_HOME%"=="" (
  @SET "JAVA_CMD=%JAVA_HOME%\bin\java.exe"
  GOTO findMavenWrapper
)

@SET "JAVA_CMD=java.exe"

:findMavenWrapper
@SET WRAPPER_JAR="%BASE_DIR%.mvn\wrapper\maven-wrapper.jar"
@SET WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

@SET DOWNLOAD_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar"

FOR /F "usebackq tokens=1,2 delims==" %%A IN ("%BASE_DIR%.mvn\wrapper\maven-wrapper.properties") DO (
  IF "%%A"=="wrapperUrl" SET DOWNLOAD_URL=%%B
)

@IF EXIST %WRAPPER_JAR% (
  GOTO runMavenWithJavaHome
)

@ECHO Downloading Maven Wrapper...
@"%JAVA_CMD%" -cp "" org.apache.maven.wrapper.MavenWrapperDownloader "%DOWNLOAD_URL%" "%BASE_DIR%.mvn\wrapper" 2>NUL
@IF NOT EXIST %WRAPPER_JAR% (
  @"%JAVA_CMD%" -Dmaven.multiModuleProjectDirectory="%BASE_DIR%" ^
    -jar "%DOWNLOAD_URL%" %MAVEN_PROJECTBASEDIR%
)

:runMavenWithJavaHome
@"%JAVA_CMD%" ^
  -classpath %WRAPPER_JAR% ^
  "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" ^
  %MAVEN_OPTS% ^
  %MAVEN_DEBUG_OPTS% ^
  %WRAPPER_LAUNCHER% %MAVEN_CONFIG% %*

@IF "%ERRORLEVEL%"=="0" GOTO end
@SET ERROR_CODE=%ERRORLEVEL%

:end
@ENDLOCAL & SET ERROR_CODE=%ERROR_CODE%
@IF NOT "%SCOOPSHIM%"=="" (EXIT /B %ERROR_CODE%)
@EXIT /B %ERROR_CODE%
