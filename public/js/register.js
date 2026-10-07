// Регистрация: поля проверяет тот же Validator, что и сервер
const form = document.getElementById('register-form');
const message = document.getElementById('message');
const next = new URLSearchParams(location.search).get('next');

function formData() {
  return {
    login: form.login.value.trim(),
    password: form.password.value,
    fio: form.fio.value.trim(),
    phone: form.phone.value.trim(),
    email: form.email.value.trim()
  };
}

// Маска телефона: номер, начатый с 8, сам складывается в 8(XXX)XXX-XX-XX.
// Другой формат (+7 912 ...) не трогаем: под полем появится ошибка
form.phone.addEventListener('input', (event) => {
  if (event.inputType && event.inputType.startsWith('delete')) return;   // стирать не мешаем
  if (!/^8[\d()-]*$/.test(form.phone.value)) return;

  const digits = form.phone.value.replace(/\D/g, '').slice(0, 11);
  let phone = digits.slice(0, 1);
  if (digits.length > 1) phone += '(' + digits.slice(1, 4);
  if (digits.length > 4) phone += ')' + digits.slice(4, 7);
  if (digits.length > 7) phone += '-' + digits.slice(7, 9);
  if (digits.length > 9) phone += '-' + digits.slice(9, 11);
  form.phone.value = phone;
});

liveValidate(form, () => Validator.registration(formData()));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.hidden = true;

  const data = formData();
  const errors = Validator.registration(data);
  showErrors(form, errors);
  if (hasErrors(errors)) return;

  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  const result = await api('/api/register', data);
  button.disabled = false;

  if (result.ok) {
    location.href = '/login?registered=1' + (next ? '&next=' + encodeURIComponent(next) : '');
  } else if (result.errors) {
    showErrors(form, result.errors);   // например, «Этот логин уже занят»
  } else {
    showNotice(message, result.message, true);
  }
});

// Ссылка «Войти» не теряет страницу, на которую человек шёл
if (next) {
  document.querySelector('.auth-switch a').href = '/login?next=' + encodeURIComponent(next);
}
