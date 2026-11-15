DROP DATABASE IF EXISTS padel_db;
CREATE DATABASE padel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE padel_db;

CREATE TABLE usuarios (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol           ENUM('admin', 'cliente') NOT NULL DEFAULT 'cliente',
    creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuarios_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE canchas (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL,
    tipo        ENUM('techada', 'descubierta') NOT NULL DEFAULT 'descubierta',
    precio_hora DECIMAL(10,2) NOT NULL,
    activa      BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_canchas_nombre UNIQUE (nombre),
    CONSTRAINT ck_canchas_precio CHECK (precio_hora > 0)
) ENGINE=InnoDB;

CREATE TABLE turnos (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id   INT UNSIGNED NOT NULL,
    cancha_id    INT UNSIGNED NOT NULL,
    fecha        DATE NOT NULL,
    hora_inicio  TIME NOT NULL,
    hora_fin     TIME NOT NULL,
    estado       ENUM('reservado', 'cancelado', 'completado') NOT NULL DEFAULT 'reservado',
    precio_total DECIMAL(10,2) NOT NULL,
    creado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    slot_activo  TINYINT GENERATED ALWAYS AS (IF(estado = 'cancelado', NULL, 1)) STORED,

    CONSTRAINT fk_turnos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_turnos_cancha  FOREIGN KEY (cancha_id)  REFERENCES canchas(id),
    CONSTRAINT ck_turnos_horas   CHECK (hora_fin > hora_inicio),
    CONSTRAINT ck_turnos_precio  CHECK (precio_total >= 0),
    CONSTRAINT uq_turnos_slot UNIQUE (cancha_id, fecha, hora_inicio, slot_activo),
    INDEX idx_turnos_fecha (fecha)
) ENGINE=InnoDB;

CREATE TABLE pagos (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    turno_id   INT UNSIGNED NOT NULL,
    monto      DECIMAL(10,2) NOT NULL,
    metodo     ENUM('efectivo', 'transferencia', 'tarjeta') NOT NULL DEFAULT 'efectivo',
    estado     ENUM('pendiente', 'aprobado', 'reembolsado') NOT NULL DEFAULT 'pendiente',
    pagado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pagos_turno FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE,
    CONSTRAINT ck_pagos_monto CHECK (monto > 0)
) ENGINE=InnoDB;

DELIMITER //

CREATE PROCEDURE sp_reservar_turno(
    IN  p_usuario_id   INT UNSIGNED,
    IN  p_cancha_id    INT UNSIGNED,
    IN  p_fecha        DATE,
    IN  p_hora_inicio  TIME,
    IN  p_duracion_min INT,
    IN  p_metodo_pago  VARCHAR(20),
    OUT p_turno_id     INT UNSIGNED
)
BEGIN
    DECLARE v_precio_hora DECIMAL(10,2) DEFAULT NULL;
    DECLARE v_activa      BOOLEAN DEFAULT NULL;
    DECLARE v_hora_fin    TIME;
    DECLARE v_total       DECIMAL(10,2);
    DECLARE v_solapados   INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT precio_hora, activa INTO v_precio_hora, v_activa
    FROM canchas WHERE id = p_cancha_id FOR UPDATE;

    IF v_precio_hora IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cancha no existe';
    END IF;
    IF v_activa = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cancha no esta disponible';
    END IF;
    IF p_duracion_min NOT IN (60, 90, 120) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Duracion invalida (60, 90 o 120 minutos)';
    END IF;

    SET v_hora_fin = ADDTIME(p_hora_inicio, SEC_TO_TIME(p_duracion_min * 60));
    SET v_total    = v_precio_hora * p_duracion_min / 60;

    SELECT COUNT(*) INTO v_solapados
    FROM turnos
    WHERE cancha_id = p_cancha_id
      AND fecha = p_fecha
      AND estado <> 'cancelado'
      AND p_hora_inicio < hora_fin
      AND v_hora_fin    > hora_inicio;

    IF v_solapados > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El horario ya esta ocupado';
    END IF;

    INSERT INTO turnos (usuario_id, cancha_id, fecha, hora_inicio, hora_fin, precio_total)
    VALUES (p_usuario_id, p_cancha_id, p_fecha, p_hora_inicio, v_hora_fin, v_total);

    SET p_turno_id = LAST_INSERT_ID();

    INSERT INTO pagos (turno_id, monto, metodo, estado)
    VALUES (p_turno_id, ROUND(v_total * 0.30, 2), p_metodo_pago, 'pendiente');

    COMMIT;
END //

DELIMITER ;

INSERT INTO canchas (nombre, tipo, precio_hora) VALUES
    ('Cancha 1', 'techada',     12000.00),
    ('Cancha 2', 'techada',     12000.00),
    ('Cancha 3', 'descubierta',  9000.00);
