// Личный кабинет: свои заявки и отзывы к завершённым
const list = document.getElementById('applications');
const empty = document.getElementById('empty');
const message = document.getElementById('message');
let applications = [];

if (new URLSearchParams(location.search).has('created')) {
  showNotice(message, 'Заявка отправлена. Статус «Новая»: администратор проверит её и подтвердит запись');
  history.replaceState(null, '', '/cabinet');   // при обновлении страницы сообщение не повторится
}

async function loadApplications() {
  const result = await api('/api/my-applications');
  if (!Array.isArray(result)) {
    showNotice(message, result.message, true);
    return;
  }
  applications = result;
  empty.hidden = applications.length > 0;   // пусто - показываем empty.webp с подписью
  list.innerHTML = applications.map(applicationCard).join('');
}

function applicationCard(app) {
  return `
    <div class="col reveal">
      <article class="app-card" data-id="${app.id}">
        <div class="app-photo">
          <img src="/${escapeHtml(app.image)}" alt="${escapeHtml(app.workshop)}" width="640" height="360" loading="lazy">
        </div>
        <div class="app-body">
          <div class="app-top">
            ${statusBadge(app.status_id, app.status)}
            <span class="app-number">Заявка №${app.id}</span>
          </div>
          <h3>${escapeHtml(app.workshop)}</h3>
          <div class="app-facts">
            <p class="app-fact"><img src="/images/icon-calendar.png" alt="Дата" width="20" height="20">${formatDate(app.class_date)}</p>
            <p class="app-fact"><img src="/images/icon-card.png" alt="Оплата" width="20" height="20">${escapeHtml(app.payment)}</p>
          </div>
          <div class="review-slot">${reviewHtml(app)}</div>
        </div>
      </article>
    </div>`;
}

// Отзыв: уже есть - показываем; заявка «Завершено» - кнопка «Оставить отзыв»; иначе подсказка
function reviewHtml(app) {
  if (app.rating) {
    return `
      <div class="review">
        <p class="review-title">Ваш отзыв</p>
        ${starsHtml(app.rating)}
        <p class="review-text">${escapeHtml(app.comment)}</p>
      </div>`;
  }
  if (app.status_id !== STATUS_DONE) {
    return '<p class="review-hint">Отзыв можно оставить после мастер-класса</p>';
  }
  return `
    <div class="review">
      <button class="btn-main btn-sm review-open" type="button">Оставить отзыв</button>
      <form class="review-form" novalidate hidden>
        <fieldset class="stars">
          <legend class="field-label">Оценка</legend>
          <div class="stars-row">${starInputs(app.id)}</div>
        </fieldset>
        <p class="field-error" data-for="rating" aria-live="polite"></p>
        <label class="field-label" for="comment-${app.id}">Отзыв</label>
        <textarea class="form-control" id="comment-${app.id}" name="comment" rows="3" maxlength="1000"
                  placeholder="Что понравилось, что получилось сделать?"></textarea>
        <p class="field-error" data-for="comment" aria-live="polite"></p>
        <button class="btn-main btn-sm" type="submit">Отправить отзыв</button>
      </form>
    </div>`;
}

// Пять звёзд icon-star. Порядок 5..1: так CSS подсвечивает выбранную звезду и все левее
function starInputs(appId) {
  let html = '';
  for (let value = 5; value >= 1; value--) {
    html += `
      <input type="radio" id="star-${appId}-${value}" name="rating" value="${value}">
      <label for="star-${appId}-${value}" title="${value} из 5">
        <img src="/images/icon-star.png" alt="${value} из 5" width="32" height="32">
      </label>`;
  }
  return html;
}

// Кнопка «Оставить отзыв» открывает форму под собой
list.addEventListener('click', (event) => {
  const button = event.target.closest('.review-open');
  if (!button) return;
  const reviewForm = button.nextElementSibling;
  button.hidden = true;
  reviewForm.hidden = false;
  reviewForm.querySelector('input').focus();
});

list.addEventListener('submit', async (event) => {
  event.preventDefault();
  const reviewForm = event.target;
  const card = reviewForm.closest('.app-card');
  const app = applications.find((item) => String(item.id) === card.dataset.id);

  const checked = reviewForm.querySelector('input[name="rating"]:checked');
  const data = {
    application_id: app.id,
    rating: checked ? checked.value : '',
    comment: reviewForm.comment.value.trim()
  };

  const errors = Validator.review(data);
  showErrors(reviewForm, errors);
  if (hasErrors(errors)) return;

  const result = await api('/api/reviews', data);
  if (result.ok) {
    app.rating = Number(data.rating);
    app.comment = data.comment;
    card.querySelector('.review-slot').innerHTML = reviewHtml(app);
    showNotice(message, 'Спасибо за отзыв! Он виден администратору');
  } else if (result.errors) {
    showErrors(reviewForm, result.errors);
  } else {
    showNotice(message, result.message, true);
  }
});

// Ошибка у звёзд пропадает, как только оценку поставили
list.addEventListener('change', (event) => {
  if (event.target.name === 'rating') {
    setFieldError(event.target.form, 'rating', '');
  }
});

list.addEventListener('input', (event) => {
  if (event.target.name === 'comment' && event.target.value.trim()) {
    setFieldError(event.target.form, 'comment', '');
  }
});

loadApplications();
