@echo off
chcp 65001 > nul
rem Создание базы masterskie без phpMyAdmin и Workbench.
rem Берёт адрес, пользователя и пароль MySQL из config.js, как и сам сайт.
cd /d "%~dp0"

where node > nul 2> nul
if errorlevel 1 (
  echo Не найден Node.js. Установите Node.js LTS с сайта nodejs.org и снова запустите setup-db.bat
  pause
  exit /b 1
)

if not exist node_modules (
  echo Нет папки node_modules, ставлю пакеты командой npm install. Для этого нужен интернет.
  call npm install
)

echo Перед запуском включите MySQL: в XAMPP кнопка Start у MySQL или служба MySQL80.
echo ВНИМАНИЕ: таблицы базы masterskie создаются заново, старые пользователи и заявки удалятся.
echo.
echo 1 - база и тестовые данные (ivan2027 и anna2027, пароль Qwerty123)
echo 2 - только пустая база с администратором Master2027 / Demo88
choice /c 12 /n /m "Нажмите 1 или 2: "
if errorlevel 2 (
  node database\setup.js
) else (
  node database\setup.js --demo
)
echo.
pause
