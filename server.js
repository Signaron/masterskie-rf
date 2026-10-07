const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const config = require('./config');
const Database = require('./classes/Database');
const Validator = require('./public/js/Validator');

const app = express();
const db = new Database(config.db);
const STATUS = Database.STATUS;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: config.secret,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 }   // 8 часов
}));


// ---------- Вспомогательные функции ----------

// SHA-256 от соли и пароля. Соль своя у каждого: одинаковые пароли дают разные хеши
function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(salt + password).digest('hex');
}

function text(value) {
  return String(value ?? '').trim();
}

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

function readView(file) {
  return fs.readFileSync(path.join(__dirname, 'views', file), 'utf8');
}

// Шапка и подвал одни на все страницы: сервер подставляет их вместо меток <!-- header --> и <!-- footer -->.
// Роль в <body data-role> нужна стилям: гость не видит «Мои заявки», пользователь не видит «Войти»
function sendPage(req, res, name) {
  const role = req.session.user ? req.session.user.role : 'guest';
  const page = readView(name + '.html')
    .replace('<!-- header -->', readView('partials/header.html'))
    .replace('<!-- footer -->', readView('partials/footer.html'))
    .replace('<body', `<body data-role="${role}"`);
  res.send(page);
}


// ---------- Доступ ----------

function onlyUsers(req, res, next) {
  if (req.session.user) {
    return next();
  }
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ ok: false, message: 'Войдите в систему' });
  }
  res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
}

function onlyAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  if (req.path.startsWith('/api/')) {
    return res.status(403).json({ ok: false, message: 'Только для администратора' });
  }
  res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
}


// ---------- Страницы ----------

app.get('/', (req, res) => sendPage(req, res, 'index'));
app.get('/register', (req, res) => sendPage(req, res, 'register'));
app.get('/login', (req, res) => sendPage(req, res, 'login'));
app.get('/application', onlyUsers, (req, res) => sendPage(req, res, 'application'));
app.get('/cabinet', onlyUsers, (req, res) => sendPage(req, res, 'cabinet'));
app.get('/admin', onlyAdmin, (req, res) => sendPage(req, res, 'admin'));

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});


// ---------- Справочники ----------

app.get('/api/workshops', async (req, res) => {
  res.json(await db.getWorkshops());   // каталог на главной строится из базы
});

app.get('/api/payment-methods', async (req, res) => {
  res.json(await db.getPaymentMethods());
});

app.get('/api/statuses', async (req, res) => {
  res.json(await db.getStatuses());
});


// ---------- Регистрация и вход ----------

app.post('/api/register', async (req, res) => {
  const body = req.body ?? {};
  const data = {
    login: text(body.login),
    password: String(body.password ?? ''),
    fio: text(body.fio),
    phone: text(body.phone),
    email: text(body.email)
  };

  const errors = Validator.registration(data);
  if (!errors.login && await db.loginExists(data.login)) {
    errors.login = 'Этот логин уже занят';
  }
  if (hasErrors(errors)) {
    return res.json({ ok: false, errors });
  }

  data.salt = crypto.randomBytes(8).toString('hex');
  data.passwordHash = hashPassword(data.password, data.salt);
  try {
    await db.addUser(data);
  } catch (error) {
    // логин успели занять между проверкой и записью: сработал UNIQUE в базе
    if (error.code === 'ER_DUP_ENTRY') {
      return res.json({ ok: false, errors: { login: 'Этот логин уже занят' } });
    }
    throw error;
  }
  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const body = req.body ?? {};
  const data = { login: text(body.login), password: String(body.password ?? '') };

  const errors = Validator.login(data);
  if (hasErrors(errors)) {
    return res.json({ ok: false, errors });
  }

  const user = await db.findUserByLogin(data.login);
  if (!user || hashPassword(data.password, user.salt) !== user.password_hash) {
    return res.json({ ok: false, message: 'Неверный логин или пароль' });
  }

  req.session.user = { id: user.id, login: user.login, fio: user.fio, role: user.role };
  res.json({ ok: true, redirect: user.role === 'admin' ? '/admin' : '/cabinet' });
});


// ---------- Заявки пользователя ----------

app.get('/api/my-applications', onlyUsers, async (req, res) => {
  res.json(await db.getUserApplications(req.session.user.id));
});

app.post('/api/applications', onlyUsers, async (req, res) => {
  const body = req.body ?? {};
  const data = {
    workshop_id: text(body.workshop_id),
    class_date: text(body.class_date),
    payment_method_id: text(body.payment_method_id)
  };

  const errors = Validator.application(data);
  if (!errors.workshop_id && !(await db.workshopExists(data.workshop_id))) {
    errors.workshop_id = 'Такой мастерской нет';
  }
  if (!errors.payment_method_id && !(await db.paymentMethodExists(data.payment_method_id))) {
    errors.payment_method_id = 'Такого способа оплаты нет';
  }
  if (hasErrors(errors)) {
    return res.json({ ok: false, errors });
  }

  await db.addApplication(req.session.user.id, data);
  res.json({ ok: true });
});

app.post('/api/reviews', onlyUsers, async (req, res) => {
  const body = req.body ?? {};
  const data = {
    application_id: text(body.application_id),
    rating: text(body.rating),
    comment: text(body.comment)
  };

  const errors = Validator.review(data);
  if (hasErrors(errors)) {
    return res.json({ ok: false, errors });
  }

  // Проверка на сервере, а не только в интерфейсе: своя заявка, «Завершено», отзыва ещё нет
  const application = await db.getUserApplication(data.application_id, req.session.user.id);
  if (!application) {
    return res.json({ ok: false, message: 'Заявка не найдена' });
  }
  if (application.status_id !== STATUS.DONE) {
    return res.json({ ok: false, message: 'Отзыв можно оставить только после завершения мастер-класса' });
  }
  if (application.review_id) {
    return res.json({ ok: false, message: 'Отзыв к этой заявке уже есть' });
  }

  await db.addReview(application.id, data.rating, data.comment);
  res.json({ ok: true });
});


// ---------- Администратор ----------

app.get('/api/admin/applications', onlyAdmin, async (req, res) => {
  const status = text(req.query.status);
  // фильтр выполняет база: WHERE status_id = ?
  res.json(await db.getApplications(/^\d+$/.test(status) ? Number(status) : null));
});

app.post('/api/admin/status', onlyAdmin, async (req, res) => {
  const body = req.body ?? {};
  const statusId = Number(body.status_id);
  if (statusId !== STATUS.CONFIRMED && statusId !== STATUS.DONE) {
    return res.json({ ok: false, message: 'Такой статус поставить нельзя' });
  }

  const changed = await db.changeStatus(text(body.id), statusId);
  if (!changed) {
    return res.json({ ok: false, message: 'Статус уже изменён, обновите страницу' });
  }
  res.json({ ok: true });
});


// ---------- Ошибки ----------

app.use((error, req, res, next) => {
  console.log('Ошибка: ' + Database.explainError(error));
  res.status(error.status || 500).json({ ok: false, message: 'Ошибка сервера, попробуйте ещё раз' });
});


app.listen(config.port, (error) => {
  if (error) {
    console.log(error.code === 'EADDRINUSE'
      ? `Порт ${config.port} занят: сайт уже запущен в другом окне. Закройте его или поменяйте port в config.js`
      : error.message);
    process.exit(1);
  }
  console.log('Сайт работает: http://localhost:' + config.port);

  // Сразу проверяем базу, чтобы ошибка была видна в окне, а не только при первом запросе
  db.query('SELECT COUNT(*) AS total FROM workshops')
    .then(() => console.log('База данных подключена'))
    .catch((dbError) => console.log('Нет связи с базой: ' + Database.explainError(dbError)));
});
