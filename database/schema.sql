-- =====================================================================
-- Sistema de gestion de turnos de padel - Esquema MySQL (8.0.16+)
-- =====================================================================

DROP DATABASE IF EXISTS padel_db;
CREATE DATABASE padel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE padel_db;

-- ---------------------------------------------------------------------
-- 1) USUARIOS
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,          -- NUNCA la contrasena en texto plano
    rol           ENUM('admin', 'cliente') NOT NULL DEFAULT 'cliente',
    creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuarios_email UNIQUE (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2) CANCHAS
-- ---------------------------------------------------------------------
CREATE TABLE canchas (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL,
    tipo        ENUM('techada', 'descubierta') NOT NULL DEFAULT 'descubierta',
    precio_hora DECIMAL(10,2) NOT NULL,
    activa      BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_canchas_nombre UNIQUE (nombre),
    CONSTRAINT ck_canchas_precio CHECK (precio_hora > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3) TURNOS (reservas)
-- ---------------------------------------------------------------------
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

    -- Columna generada: vale 1 si el turno esta "vivo", NULL si esta cancelado.
    -- Sirve para que el UNIQUE de abajo solo aplique a turnos no cancelados
    -- (en un indice UNIQUE, MySQL permite varios NULL).
    slot_activo  TINYINT GENERATED ALWAYS AS (IF(estado = 'cancelado', NULL, 1)) STORED,

    CONSTRAINT fk_turnos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_turnos_cancha  FOREIGN KEY (cancha_id)  REFERENCES canchas(id),
    CONSTRAINT ck_turnos_horas   CHECK (hora_fin > hora_inicio),
    CONSTRAINT ck_turnos_precio  CHECK (precio_total >= 0),
    CONSTRAINT uq_turnos_slot UNIQUE (cancha_id, fecha, hora_inicio, slot_activo),
    INDEX idx_turnos_fecha (fecha)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4) PAGOS (una sena o pago por turno)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- STORED PROCEDURE: reservar un turno de forma transaccional
-- ---------------------------------------------------------------------
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

    -- Si ocurre CUALQUIER error SQL: deshacer todo y re-lanzar el error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Bloqueamos la fila de la cancha: dos reservas simultaneas para la
    -- misma cancha se ejecutan una atras de la otra, no a la vez.
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

    -- Hay algun turno no cancelado que se pise con este horario?
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

    -- Sena del 30% registrada como pago pendiente
    INSERT INTO pagos (turno_id, monto, metodo, estado)
    VALUES (p_turno_id, ROUND(v_total * 0.30, 2), p_metodo_pago, 'pendiente');

    COMMIT;
END //

DELIMITER ;

-- ---------------------------------------------------------------------
-- Datos iniciales (los usuarios se crean desde la API para hashear la clave)
-- ---------------------------------------------------------------------
INSERT INTO canchas (nombre, tipo, precio_hora) VALUES
    ('Cancha 1', 'techada',     12000.00),
    ('Cancha 2', 'techada',     12000.00),
    ('Cancha 3', 'descubierta',  9000.00);
