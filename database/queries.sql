-- Запросы для проверки данных: phpMyAdmin -> база masterskie -> вкладка SQL -> «Вперёд»
-- (в Workbench: открыть файл, выделить нужный запрос, Ctrl+Enter)

USE masterskie;

-- Все заявки с именами вместо номеров
SELECT applications.id, users.fio, users.login, workshops.name AS workshop,
       applications.class_date, payment_methods.name AS payment, statuses.name AS status
FROM applications
JOIN users           ON users.id = applications.user_id
JOIN workshops       ON workshops.id = applications.workshop_id
JOIN payment_methods ON payment_methods.id = applications.payment_method_id
JOIN statuses        ON statuses.id = applications.status_id
ORDER BY applications.id DESC;

-- Отзывы с оценками
SELECT reviews.id, users.login, workshops.name AS workshop, reviews.rating, reviews.comment, reviews.created_at
FROM reviews
JOIN applications ON applications.id = reviews.application_id
JOIN users        ON users.id = applications.user_id
JOIN workshops    ON workshops.id = applications.workshop_id;

-- Сколько заявок в каждом статусе
SELECT statuses.name, COUNT(applications.id) AS total
FROM statuses
LEFT JOIN applications ON applications.status_id = statuses.id
GROUP BY statuses.id, statuses.name
ORDER BY statuses.id;
