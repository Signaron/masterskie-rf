// Создаёт базу из schema.sql, а с ключом --demo ещё и загружает тестовые данные.
// Нужен, когда под рукой нет phpMyAdmin или Workbench: подключается так же, как сайт (config.js).
// Запуск: двойной щелчок по setup-db.bat или команда  node database/setup.js --demo
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config');
const Database = require('../classes/Database');

const files = ['schema.sql'];
if (process.argv.includes('--demo')) {
  files.push('demo-data.sql');
}

async function setup() {
  // Подключаемся к серверу без выбора базы: её ещё может не быть
  const { database, ...server } = config.db;
  const connection = await mysql.createConnection({ ...server, multipleStatements: true });

  for (const file of files) {
    await connection.query(fs.readFileSync(path.join(__dirname, file), 'utf8'));
    console.log('Выполнен ' + file);
  }
  await connection.end();

  console.log(`Готово: база ${database} создана. Вход администратора: Master2027 / Demo88`);
}

setup().catch((error) => {
  console.log('Не получилось: ' + Database.explainError(error));
  process.exitCode = 1;
});
