-- =============================================================
--  Тестовые данные: два пользователя и заявки во всех статусах.
--  Загружать один раз, сразу после schema.sql.
--  Пароль у обоих пользователей: Qwerty123
--  Даты считаются от сегодняшнего дня, поэтому не устаревают.
-- =============================================================

SET NAMES utf8mb4;
USE masterskie;

INSERT INTO users (login, salt, password_hash, fio, phone, email) VALUES
  ('ivan2027', '5b1e8c0d9a7f3e21', SHA2(CONCAT('5b1e8c0d9a7f3e21', 'Qwerty123'), 256),
   'Петров Иван Сергеевич', '8(912)345-67-89', 'ivan@mail.ru'),
  ('anna2027', 'c4d2a9e7f0b13865', SHA2(CONCAT('c4d2a9e7f0b13865', 'Qwerty123'), 256),
   'Смирнова Анна Олеговна', '8(903)111-22-33', 'anna@yandex.ru');

-- Мастерские: 1 гончарная, 2 художественная, 3 кулинарная, 4 столярная, 5 свечи
-- Оплата: 1 наличными, 2 СБП. Статусы: 1 Новая, 2 Запись подтверждена, 3 Завершено
INSERT INTO applications (user_id, workshop_id, class_date, payment_method_id, status_id, created_at) VALUES
  ((SELECT id FROM users WHERE login = 'ivan2027'), 1, CURDATE() - INTERVAL 20 DAY, 2, 3, NOW() - INTERVAL 30 DAY),
  ((SELECT id FROM users WHERE login = 'ivan2027'), 5, CURDATE() - INTERVAL 6 DAY,  1, 3, NOW() - INTERVAL 14 DAY),
  ((SELECT id FROM users WHERE login = 'ivan2027'), 3, CURDATE() + INTERVAL 5 DAY,  2, 2, NOW() - INTERVAL 3 DAY),
  ((SELECT id FROM users WHERE login = 'ivan2027'), 4, CURDATE() + INTERVAL 12 DAY, 1, 1, NOW() - INTERVAL 1 DAY),
  ((SELECT id FROM users WHERE login = 'anna2027'), 2, CURDATE() + INTERVAL 9 DAY,  2, 1, NOW() - INTERVAL 2 DAY),
  ((SELECT id FROM users WHERE login = 'anna2027'), 3, CURDATE() + INTERVAL 16 DAY, 1, 2, NOW() - INTERVAL 4 DAY);

-- Отзыв Ивана о гончарной мастерской (заявка уже «Завершено»)
INSERT INTO reviews (application_id, rating, comment)
SELECT applications.id, 5, 'Мастер всё показал на своём круге, а потом помог с моей чашкой. Приду ещё!'
FROM applications
JOIN users ON users.id = applications.user_id
WHERE users.login = 'ivan2027' AND applications.workshop_id = 1;
