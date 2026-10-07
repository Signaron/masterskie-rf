// Общие функции для всех страниц

const STATUS_DONE = 3;   // «Завершено»: только к таким заявкам можно оставить отзыв


// ---------- Запросы к серверу ----------

// GET, если data не передан, иначе POST с JSON. Без входа сервер ответит 401: ведём на страницу входа
async function api(url, data) {
  const options = data === undefined ? {} : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  };
  try {
    const response = await fetch(url, options);
    if (response.status === 401) {
      location.href = '/login?next=' + encodeURIComponent(location.pathname + location.search);
    }
    return await response.json();
  } catch {
    return { ok: false, message: 'Нет связи с сервером. Проверьте, что сайт запущен' };
  }
}


// ---------- Ошибки в формах ----------

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

// Ошибка под полем: текст в <p class="field-error" data-for="имя">, поле подсвечивается
function setFieldError(form, name, message) {
  const box = form.querySelector(`.field-error[data-for="${name}"]`);
  const input = form.querySelector(`[name="${name}"]`);
  if (!box || !input) return;

  // у звёзд подсвечиваем всю группу, у обычных полей само поле
  const target = input.type === 'radio' ? input.closest('.stars') : input;
  target.classList.remove('is-error');
  if (message) {
    void target.offsetWidth;          // перезапуск анимации покачивания
    target.classList.add('is-error');
  }
  box.textContent = message || '';
  box.classList.toggle('is-shown', Boolean(message));
}

// Показать ошибки всей формы: { login: 'текст', ... }. Поля без ошибки очищаются
function showErrors(form, errors) {
  form.querySelectorAll('.field-error').forEach((box) => {
    setFieldError(form, box.dataset.for, errors[box.dataset.for]);
  });
  const first = form.querySelector('.is-error');
  if (first && first.focus) first.focus();
}

// Проверка «на лету»: поле с ошибкой перепроверяется при вводе, остальные - когда уходим с поля
function liveValidate(form, validate) {
  form.addEventListener('input', (event) => {
    const box = form.querySelector(`.field-error[data-for="${event.target.name}"]`);
    if (box && box.classList.contains('is-shown')) {
      setFieldError(form, event.target.name, validate()[event.target.name]);
    }
  });
  form.addEventListener('focusout', (event) => {
    if (event.target.value) {
      setFieldError(form, event.target.name, validate()[event.target.name]);
    }
  });
}

// Сообщение над формой или списком (успех или ошибка)
function showNotice(box, text, isError) {
  box.hidden = true;
  void box.offsetWidth;               // повторное сообщение снова появляется плавно
  box.textContent = text;
  box.classList.toggle('notice-error', Boolean(isError));
  box.hidden = false;
}


// ---------- Вывод данных ----------

// Экранирование: текст пользователя не может стать HTML-кодом (защита от XSS)
function escapeHtml(value) {
  const chars = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, (char) => chars[char]);
}

// '2026-10-07' -> '07.10.2026'
function formatDate(value) {
  return String(value).slice(0, 10).split('-').reverse().join('.');
}

function statusBadge(statusId, name) {
  return `<span class="badge-status status-${statusId}">${escapeHtml(name)}</span>`;
}

function starsHtml(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    const off = i > rating ? ' class="is-off"' : '';
    stars += `<img src="/images/icon-star.png" alt="" width="18" height="18"${off}>`;
  }
  return `<span class="review-stars" role="img" aria-label="Оценка ${rating} из 5">${stars}</span>`;
}


// ---------- Меню ----------

// Подсветить пункт меню текущей страницы
document.querySelectorAll('.menu-link').forEach((link) => {
  if (link.pathname === location.pathname && !link.hash) {
    link.setAttribute('aria-current', 'page');
  }
});
