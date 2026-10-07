// Вход: пустые поля проверяются в браузере, пару логин-пароль проверяет сервер
const form = document.getElementById('login-form');
const message = document.getElementById('message');
const params = new URLSearchParams(location.search);

if (params.has('registered')) {
  showNotice(message, 'Аккаунт создан. Теперь войдите');
}

// Куда вернуться после входа: только адрес этого же сайта
function nextPage(fallback) {
  const next = params.get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}

function formData() {
  return {
    login: form.login.value.trim(),
    password: form.password.value
  };
}

liveValidate(form, () => Validator.login(formData()));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.hidden = true;

  const data = formData();
  const errors = Validator.login(data);
  showErrors(form, errors);
  if (hasErrors(errors)) return;

  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  const result = await api('/api/login', data);
  button.disabled = false;

  if (result.ok) {
    // администратор всегда попадает в панель, пользователь - туда, куда шёл
    location.href = result.redirect === '/admin' ? '/admin' : nextPage(result.redirect);
  } else if (result.errors) {
    showErrors(form, result.errors);
  } else {
    showNotice(message, result.message, true);   // «Неверный логин или пароль»
    form.password.value = '';
    form.password.focus();
  }
});

if (params.get('next')) {
  document.querySelector('.auth-switch a').href = '/register?next=' + encodeURIComponent(params.get('next'));
}
