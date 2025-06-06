@echo off
echo XAMPP PHP Admin Script
echo ========================
echo.

REM You can modify this path to match your XAMPP installation
set XAMPP_PHP="C:\xampp\php\php.exe"

echo Using PHP from: %XAMPP_PHP%
echo.

REM Check if the PHP executable exists
if not exist %XAMPP_PHP% (
    echo ERROR: PHP not found at %XAMPP_PHP%
    echo.
    echo Please edit this batch file and update the XAMPP_PHP path at the top.
    echo Common XAMPP locations:
    echo - C:\xampp\php\php.exe
    echo - C:\XAMPP\php\php.exe
    echo - D:\xampp\php\php.exe
    echo - E:\xampp\php\php.exe
    echo.
    echo Or run manually:
    echo "C:\path\to\your\xampp\php\php.exe" make_first_user_admin.php
    goto :end
)

echo Making first user admin...
echo.
%XAMPP_PHP% make_first_user_admin.php

:end
echo.
echo Press any key to exit...
pause > nul