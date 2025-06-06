@echo off
echo Making first user admin...
echo.

REM Try different XAMPP PHP paths
if exist "C:\xampp\php\php.exe" (
    "C:\xampp\php\php.exe" make_admin.php
) else if exist "C:\XAMPP\php\php.exe" (
    "C:\XAMPP\php\php.exe" make_first_user_admin.php
) else if exist "D:\xampp\php\php.exe" (
    "D:\xampp\php\php.exe" make_first_user_admin.php
) else if exist "E:\xampp\php\php.exe" (
    "E:\xampp\php\php.exe" make_first_user_admin.php
) else (
    echo XAMPP PHP not found in common locations.
    echo Please run manually with your XAMPP PHP path:
    echo "C:\path\to\xampp\php\php.exe" make_first_user_admin.php
    echo.
    echo Common XAMPP locations:
    echo - C:\xampp\php\php.exe
    echo - D:\xampp\php\php.exe
    echo - E:\xampp\php\php.exe
)

echo.
echo Press any key to exit...
pause > nul