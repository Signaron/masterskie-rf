// Настройки проекта: всё, что может отличаться на другом компьютере, меняется только здесь
const crypto = require('crypto');

module.exports = {
  port: 3000,   // адрес сайта: http://localhost:3000

  // Ключ подписи cookie сессии. Новый при каждом запуске: сессии и так живут до перезапуска сервера
  secret: crypto.randomBytes(32).toString('hex'),

  // Подключение к MySQL
  //   XAMPP (MariaDB):  root без пароля, как ниже
  //   MySQL Server:     впишите в password пароль root, который задали при установке
  db: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'masterskie',
    dateStrings: true   // даты приходят строкой '2026-10-07', без сдвига часового пояса
  }
};
