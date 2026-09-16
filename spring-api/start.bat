@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot
set PATH=C:\tools\apache-maven-3.9.9\bin;%JAVA_HOME%\bin;%PATH%
mvn spring-boot:run
