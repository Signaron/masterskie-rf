-- =============================================================
--  Мастерские.РФ - база данных (итоговая версия: задания 1 и 3)
--  Работает в MariaDB (XAMPP, phpMyAdmin) и в MySQL 8 (Workbench).
--
--  phpMyAdmin: вкладка «Импорт» -> этот файл -> «Вперёд».
--  Workbench:  File -> Open SQL Script -> этот файл -> молния.
--  Без них:    двойной щелчок по setup-db.bat в папке проекта.
--
--  Файл создаёт таблицы заново: старые данные в них удаляются.
-- =============================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS masterskie CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE masterskie;

-- Удаляем в обратном порядке: сначала таблицы, которые ссылаются на другие
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS statuses;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS workshops;
DROP TABLE IF EXISTS users;


-- Пользователи. Логин уникален на уровне базы
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  login         VARCHAR(50)  NOT NULL,
  salt          CHAR(16)     NOT NULL,             -- случайная строка, своя у каждого
  password_hash CHAR(64)     NOT NULL,             -- SHA-256 от соли и пароля
  fio           VARCHAR(150) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  email         VARCHAR(100) NOT NULL,
  role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_login UNIQUE (login)
);


-- Справочник мастерских. image - путь к картинке карточки каталога
CREATE TABLE workshops (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  image       VARCHAR(255) NOT NULL,
  CONSTRAINT uq_workshops_name UNIQUE (name)
);


-- Справочник способов оплаты
CREATE TABLE payment_methods (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);


-- Справочник статусов. Номера заданы явно: на них опирается сервер
CREATE TABLE statuses (
  id   INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);


-- Заявки. status_id по умолчанию 1 («Новая»): статус ставит сама база
CREATE TABLE applications (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT  NOT NULL,
  workshop_id       INT  NOT NULL,
  class_date        DATE NOT NULL,                 -- желаемая дата мастер-класса
  payment_method_id INT  NOT NULL,
  status_id         INT  NOT NULL DEFAULT 1,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_applications_user     FOREIGN KEY (user_id)           REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_workshop FOREIGN KEY (workshop_id)       REFERENCES workshops (id),
  CONSTRAINT fk_applications_payment  FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id),
  CONSTRAINT fk_applications_status   FOREIGN KEY (status_id)         REFERENCES statuses (id)
);


-- Отзывы (задание 3). UNIQUE: к одной заявке не больше одного отзыва
CREATE TABLE reviews (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT     NOT NULL,
  rating         TINYINT NOT NULL,
  comment        TEXT    NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_reviews_application UNIQUE (application_id),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_application FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE
);


-- ---------- Справочники ----------

INSERT INTO statuses (id, name) VALUES
  (1, 'Новая'),
  (2, 'Запись подтверждена'),
  (3, 'Завершено');

INSERT INTO payment_methods (name) VALUES
  ('Наличными при посещении'),
  ('Переводом по СБП');

INSERT INTO workshops (name, description, image) VALUES
  ('Гончарная мастерская',  'Гончарный круг, глина и первая собственная чашка',   'images/pottery.webp'),
  ('Художественная студия', 'Живопись на холсте: от наброска до готовой картины', 'images/painting.webp'),
  ('Кулинарная студия',     'Домашняя паста, выпечка и соусы из свежих продуктов', 'images/cooking.webp'),
  ('Столярная мастерская',  'Рубанок, стамески и разделочная доска своими руками', 'images/woodwork.webp'),
  ('Мастерская свечей',     'Свечи из соевого воска с сухоцветами и ароматами',   'images/candles.webp');


-- Администратор: логин Master2027, пароль Demo88
INSERT INTO users (login, salt, password_hash, fio, phone, email, role) VALUES
  ('Master2027', 'a3f9c27e51b04d68', SHA2(CONCAT('a3f9c27e51b04d68', 'Demo88'), 256),
   'Администратор портала', '8(800)555-20-27', 'admin@masterskie.ru', 'admin');
