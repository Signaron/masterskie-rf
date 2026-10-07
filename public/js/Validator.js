// Правила проверки полей. Один файл на две стороны:
// браузер подключает его тегом <script>, сервер - через require().
// Поэтому правила в форме и на сервере не могут разойтись.
class Validator {
  // Регистрация: правила из таблицы задания
  static registration(data) {
    const errors = {};
    if (!/^[A-Za-z0-9]{6,50}$/.test(data.login)) {
      errors.login = 'Логин: латинские буквы и цифры, от 6 символов';
    }
    if (data.password.length < 8) {
      errors.password = 'Пароль: не меньше 8 символов';
    }
    if (!/^[А-Яа-яЁё ]{2,150}$/.test(data.fio) || data.fio.trim() === '') {
      errors.fio = 'ФИО: только русские буквы и пробелы';
    }
    if (!/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(data.phone)) {
      errors.phone = 'Телефон в формате 8(XXX)XXX-XX-XX';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email) || data.email.length > 100) {
      errors.email = 'Почта в формате name@mail.ru';
    }
    return errors;
  }

  // Вход: только пустые поля, неверную пару логин-пароль проверяет сервер
  static login(data) {
    const errors = {};
    if (data.login === '') errors.login = 'Введите логин';
    if (data.password === '') errors.password = 'Введите пароль';
    return errors;
  }

  // Новая заявка
  static application(data) {
    const errors = {};
    const today = Validator.today();
    if (!/^\d+$/.test(data.workshop_id)) {
      errors.workshop_id = 'Выберите мастерскую';
    }
    if (!Validator.isDate(data.class_date)) {
      errors.class_date = 'Укажите дату мастер-класса';
    } else if (data.class_date < today) {
      errors.class_date = 'Эта дата уже прошла';
    } else if (data.class_date > Validator.addDays(today, 365)) {
      errors.class_date = 'Запись открыта на год вперёд';
    }
    if (!/^\d+$/.test(data.payment_method_id)) {
      errors.payment_method_id = 'Выберите способ оплаты';
    }
    return errors;
  }

  // Отзыв: оценка звёздами от 1 до 5 и текст
  static review(data) {
    const errors = {};
    if (!/^[1-5]$/.test(data.rating)) {
      errors.rating = 'Поставьте оценку от 1 до 5 звёзд';
    }
    if (data.comment === '') {
      errors.comment = 'Напишите пару слов о мастер-классе';
    } else if (data.comment.length > 1000) {
      errors.comment = 'Отзыв не длиннее 1000 символов';
    }
    return errors;
  }


  // ---------- Даты в виде строк 'ГГГГ-ММ-ДД' ----------

  // Сегодня по местному времени компьютера
  static today() {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + month + '-' + day;
  }

  // Настоящая ли это дата: '2026-02-30' не пройдёт
  static isDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + 'T00:00:00Z');
    return !isNaN(date) && date.toISOString().slice(0, 10) === value;
  }

  static addDays(value, days) {
    const date = new Date(value + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }
}

// В браузере module нет, на сервере файл подключается через require()
if (typeof module !== 'undefined') {
  module.exports = Validator;
}
