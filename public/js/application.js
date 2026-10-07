// Новая заявка: мастерская и способ оплаты из списков (данные из базы), дата из календаря
const form = document.getElementById('application-form');
const message = document.getElementById('message');
const preview = {
  box: document.getElementById('preview'),
  image: document.getElementById('preview-image'),
  name: document.getElementById('preview-name'),
  text: document.getElementById('preview-text')
};
let workshops = [];

function formData() {
  return {
    workshop_id: form.workshop_id.value,
    class_date: form.class_date.value,
    payment_method_id: form.payment_method_id.value
  };
}

async function loadLists() {
  const [workshopList, paymentList] = await Promise.all([api('/api/workshops'), api('/api/payment-methods')]);
  if (!Array.isArray(workshopList) || !Array.isArray(paymentList)) {
    showNotice(message, 'Не удалось загрузить списки. Обновите страницу', true);
    return;
  }
  workshops = workshopList;
  workshops.forEach((workshop) => form.workshop_id.add(new Option(workshop.name, workshop.id)));
  paymentList.forEach((payment) => form.payment_method_id.add(new Option(payment.name, payment.id)));

  // Пришли с карточки каталога (?workshop=3): мастерская уже выбрана
  const fromCatalog = new URLSearchParams(location.search).get('workshop');
  if (workshops.some((workshop) => String(workshop.id) === fromCatalog)) {
    form.workshop_id.value = fromCatalog;
    showPreview();
  }
}

// Фото выбранной мастерской: старое плавно гаснет, новое проявляется
function showPreview() {
  const workshop = workshops.find((item) => String(item.id) === form.workshop_id.value);
  if (!workshop) return;

  preview.box.classList.add('is-changing');
  setTimeout(() => {
    preview.image.src = '/' + workshop.image;
    preview.image.alt = workshop.name;
    preview.name.textContent = workshop.name;
    preview.text.textContent = workshop.description;
    preview.box.classList.remove('is-changing');
  }, 200);
}

// Календарь: нельзя выбрать прошедший день и дальше года вперёд (то же проверяет сервер)
form.class_date.min = Validator.today();
form.class_date.max = Validator.addDays(Validator.today(), 365);

form.workshop_id.addEventListener('change', showPreview);
liveValidate(form, () => Validator.application(formData()));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.hidden = true;

  const data = formData();
  const errors = Validator.application(data);
  showErrors(form, errors);
  if (hasErrors(errors)) return;

  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  const result = await api('/api/applications', data);
  button.disabled = false;

  if (result.ok) {
    location.href = '/cabinet?created=1';
  } else if (result.errors) {
    showErrors(form, result.errors);
  } else {
    showNotice(message, result.message, true);
  }
});

loadLists();
