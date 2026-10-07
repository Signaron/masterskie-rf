// Панель администратора: фильтр по статусу (выборку делает база) и смена статуса
const filter = document.getElementById('filter');
const rows = document.getElementById('rows');
const cards = document.getElementById('cards');
const empty = document.getElementById('empty');
const count = document.getElementById('count');
const message = document.getElementById('message');
let statuses = [];
let applications = [];
let currentStatus = '';

// Кнопки фильтра строятся из таблицы statuses
async function loadStatuses() {
  statuses = await api('/api/statuses');
  filter.innerHTML = '<button class="chip is-active" type="button" data-filter="">Все</button>' +
    statuses.map((status) => `<button class="chip" type="button" data-filter="${status.id}">${escapeHtml(status.name)}</button>`).join('');
}

// ?status=2 сервер превращает в запрос WHERE status_id = 2
async function loadApplications() {
  const result = await api('/api/admin/applications' + (currentStatus ? '?status=' + currentStatus : ''));
  if (!Array.isArray(result)) {
    showNotice(message, result.message, true);
    return;
  }
  applications = result;
  count.textContent = 'Найдено заявок: ' + applications.length;
  empty.hidden = applications.length > 0;   // пустая выборка - empty.webp
  rows.innerHTML = applications.map(tableRow).join('');
  cards.innerHTML = applications.map(applicationCard).join('');
}

// Широкий экран: строка таблицы
function tableRow(app) {
  return `
    <tr class="reveal" data-id="${app.id}">
      <td>${app.id}</td>
      <td>${personHtml(app)}</td>
      <td>${escapeHtml(app.workshop)}${reviewLine(app)}</td>
      <td class="nowrap">${formatDate(app.class_date)}</td>
      <td>${escapeHtml(app.payment)}</td>
      <td data-slot="status">${statusBadge(app.status_id, app.status)}</td>
      <td data-slot="actions">${actionsHtml(app)}</td>
    </tr>`;
}

// Смартфон и планшет: карточка
function applicationCard(app) {
  return `
    <div class="col reveal">
      <article class="admin-card" data-id="${app.id}">
        <div class="app-top">
          <span data-slot="status">${statusBadge(app.status_id, app.status)}</span>
          <span class="app-number">Заявка №${app.id}</span>
        </div>
        <h3>${escapeHtml(app.workshop)}</h3>
        <dl>
          <dt>Пользователь</dt><dd>${personHtml(app)}</dd>
          <dt>Дата</dt><dd>${formatDate(app.class_date)}</dd>
          <dt>Оплата</dt><dd>${escapeHtml(app.payment)}</dd>
        </dl>
        ${reviewLine(app)}
        <div data-slot="actions">${actionsHtml(app)}</div>
      </article>
    </div>`;
}

function personHtml(app) {
  return `
    <span class="person-name">${escapeHtml(app.fio)}</span>
    <span class="person-contacts">${escapeHtml(app.login)}, ${escapeHtml(app.phone)}</span>
    <span class="person-contacts">${escapeHtml(app.email)}</span>`;
}

function reviewLine(app) {
  return app.rating ? `<span class="admin-review">Отзыв: ${app.rating} из 5</span>` : '';
}

// Статус двигается только вперёд: Новая -> Запись подтверждена -> Завершено
function actionsHtml(app) {
  const confirm = `<button class="btn-main btn-sm" type="button" data-id="${app.id}" data-status="2">Подтвердить запись</button>`;
  const finish = `<button class="btn-line btn-sm" type="button" data-id="${app.id}" data-status="3">Завершено</button>`;
  if (app.status_id === 1) return `<div class="actions">${confirm}${finish}</div>`;
  if (app.status_id === 2) return `<div class="actions">${finish}</div>`;
  return '<span class="muted">Действий нет</span>';
}

filter.addEventListener('click', (event) => {
  const chip = event.target.closest('.chip');
  if (!chip) return;
  filter.querySelectorAll('.chip').forEach((item) => item.classList.toggle('is-active', item === chip));
  currentStatus = chip.dataset.filter;
  loadApplications();
});

// Смена статуса: бейдж меняется на месте с анимацией, список не перечитывается,
// поэтому заявка не исчезает из выбранного фильтра у администратора на глазах
document.querySelector('main').addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-id][data-status]');
  if (!button) return;

  button.disabled = true;
  const result = await api('/api/admin/status', { id: button.dataset.id, status_id: button.dataset.status });
  if (!result.ok) {
    button.disabled = false;
    showNotice(message, result.message, true);
    return;
  }

  const app = applications.find((item) => String(item.id) === button.dataset.id);
  app.status_id = Number(button.dataset.status);
  app.status = statuses.find((status) => status.id === app.status_id).name;

  document.querySelectorAll(`tr[data-id="${app.id}"], .admin-card[data-id="${app.id}"]`).forEach((item) => {
    item.querySelector('[data-slot="status"]').innerHTML = statusBadge(app.status_id, app.status);
    item.querySelector('[data-slot="actions"]').innerHTML = actionsHtml(app);
    item.querySelector('.badge-status').classList.add('is-changed');
    item.classList.remove('is-updated');
    void item.offsetWidth;
    item.classList.add('is-updated');
  });
});

loadStatuses().then(loadApplications);
