@echo off
chcp 65001 > nul
rem Запуск сайта «Мастерские.РФ»: двойной щелчок по этому файлу.
rem Перед запуском включите MySQL (XAMPP: кнопка Start у MySQL) и создайте базу (setup-db.bat или phpMyAdmin).
cd /d "%~dp0"

where node > nul 2> nul
if errorlevel 1 (
  echo Не найден Node.js. Установите Node.js LTS с сайта nodejs.org и снова запустите start.bat
  pause
  exit /b 1
)

node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 18 ? 0 : 1)"
if errorlevel 1 (
  echo Нужен Node.js версии 18 или новее. Сейчас установлен:
  node -v
  pause
  exit /b 1
)

if not exist node_modules (
  echo Нет папки node_modules, ставлю пакеты командой npm install. Для этого нужен интернет.
  call npm install
)

echo Сайт: http://localhost:3000  Браузер откроется сам через пару секунд.
echo Чтобы остановить сайт, закройте это окно.
echo.
start "" /b cmd /c "ping -n 3 127.0.0.1 > nul && start "" http://localhost:3000"
node server.js
pause
