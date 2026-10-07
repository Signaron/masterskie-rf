// Подключение к MySQL и все запросы к базе в одном месте.
// Везде подготовленные запросы с «?»: данные пользователя не попадают в текст SQL,
// поэтому SQL-инъекция невозможна.
const mysql = require('mysql2/promise');

class Database {
  // Номера статусов из таблицы statuses
  static STATUS = { NEW: 1, CONFIRMED: 2, DONE: 3 };

  constructor(settings) {
    this.pool = mysql.createPool(settings);
  }

  async query(sql, params = []) {
    const [rows] = await this.pool.execute(sql, params);
    return rows;
  }


  // ---------- Пользователи ----------

  async loginExists(login) {
    const rows = await this.query('SELECT id FROM users WHERE login = ?', [login]);
    return rows.length > 0;
  }

  async addUser(user) {
    await this.query(
      'INSERT INTO users (login, salt, password_hash, fio, phone, email) VALUES (?, ?, ?, ?, ?, ?)',
      [user.login, user.salt, user.passwordHash, user.fio, user.phone, user.email]
    );
  }

  async findUserByLogin(login) {
    const rows = await this.query(
      'SELECT id, login, salt, password_hash, fio, role FROM users WHERE login = ?',
      [login]
    );
    return rows[0];
  }


  // ---------- Справочники ----------

  getWorkshops() {
    return this.query('SELECT id, name, description, image FROM workshops ORDER BY id');
  }

  getPaymentMethods() {
    return this.query('SELECT id, name FROM payment_methods ORDER BY id');
  }

  getStatuses() {
    return this.query('SELECT id, name FROM statuses ORDER BY id');
  }

  async workshopExists(id) {
    const rows = await this.query('SELECT id FROM workshops WHERE id = ?', [id]);
    return rows.length > 0;
  }

  async paymentMethodExists(id) {
    const rows = await this.query('SELECT id FROM payment_methods WHERE id = ?', [id]);
    return rows.length > 0;
  }


  // ---------- Заявки ----------

  // status_id не передаём: «Новая» ставит сама база (DEFAULT 1)
  async addApplication(userId, data) {
    await this.query(
      'INSERT INTO applications (user_id, workshop_id, class_date, payment_method_id) VALUES (?, ?, ?, ?)',
      [userId, data.workshop_id, data.class_date, data.payment_method_id]
    );
  }

  getUserApplications(userId) {
    return this.query(
      `SELECT a.id, a.class_date, a.status_id, s.name AS status,
              w.name AS workshop, w.image, p.name AS payment,
              r.rating, r.comment
       FROM applications a
       JOIN workshops w       ON w.id = a.workshop_id
       JOIN payment_methods p ON p.id = a.payment_method_id
       JOIN statuses s        ON s.id = a.status_id
       LEFT JOIN reviews r    ON r.application_id = a.id
       WHERE a.user_id = ?
       ORDER BY a.class_date DESC, a.id DESC`,
      [userId]
    );
  }

  // Одна заявка пользователя: нужна, чтобы проверить отзыв на сервере
  async getUserApplication(id, userId) {
    const rows = await this.query(
      `SELECT a.id, a.status_id, r.id AS review_id
       FROM applications a
       LEFT JOIN reviews r ON r.application_id = a.id
       WHERE a.id = ? AND a.user_id = ?`,
      [id, userId]
    );
    return rows[0];
  }

  // Все заявки для администратора. Фильтр по статусу выполняет база
  getApplications(statusId) {
    let sql = `SELECT a.id, a.class_date, a.created_at, a.status_id, s.name AS status,
                      w.name AS workshop, p.name AS payment,
                      u.fio, u.login, u.phone, u.email,
                      r.rating, r.comment
               FROM applications a
               JOIN users u           ON u.id = a.user_id
               JOIN workshops w       ON w.id = a.workshop_id
               JOIN payment_methods p ON p.id = a.payment_method_id
               JOIN statuses s        ON s.id = a.status_id
               LEFT JOIN reviews r    ON r.application_id = a.id`;
    const params = [];
    if (statusId) {
      sql += ' WHERE a.status_id = ?';
      params.push(statusId);
    }
    sql += ' ORDER BY a.id DESC';
    return this.query(sql, params);
  }

  // Статус двигается только вперёд: Новая -> Запись подтверждена -> Завершено
  async changeStatus(id, statusId) {
    const result = await this.query(
      'UPDATE applications SET status_id = ? WHERE id = ? AND status_id < ?',
      [statusId, id, statusId]
    );
    return result.affectedRows === 1;
  }


  // ---------- Отзывы ----------

  async addReview(applicationId, rating, comment) {
    await this.query(
      'INSERT INTO reviews (application_id, rating, comment) VALUES (?, ?, ?)',
      [applicationId, rating, comment]
    );
  }


  // Понятное объяснение частых ошибок подключения (для окна start.bat и setup-db.bat)
  static explainError(error) {
    switch (error.code) {
      case 'ECONNREFUSED':
        return 'MySQL не запущен. Нажмите Start у MySQL в XAMPP или запустите службу MySQL80';
      case 'ER_ACCESS_DENIED_ERROR':
        return 'MySQL не пускает: проверьте user и password в config.js';
      case 'ER_BAD_DB_ERROR':
        return 'Базы нет: импортируйте database/schema.sql в phpMyAdmin или запустите setup-db.bat';
      case 'ER_NO_SUCH_TABLE':
        return 'В базе нет таблиц: импортируйте database/schema.sql';
      default:
        return error.message;
    }
  }
}

module.exports = Database;
