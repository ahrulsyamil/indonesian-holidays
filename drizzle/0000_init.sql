-- Migration: 0000_init
-- Initial schema for Indonesian Holidays API.

CREATE TABLE IF NOT EXISTS `holidays` (
  `id`          INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
  `date`        TEXT     NOT NULL,
  `name`        TEXT     NOT NULL,
  `type`        TEXT     NOT NULL,
  `is_national` INTEGER  NOT NULL DEFAULT 1,
  `description` TEXT,
  `year`        INTEGER  NOT NULL GENERATED ALWAYS AS (CAST(SUBSTR(`date`, 1, 4) AS INTEGER)) STORED,
  `month`       INTEGER  NOT NULL GENERATED ALWAYS AS (CAST(SUBSTR(`date`, 6, 2) AS INTEGER)) STORED
);

CREATE INDEX IF NOT EXISTS `idx_holidays_year`       ON `holidays` (`year`);
CREATE INDEX IF NOT EXISTS `idx_holidays_year_month` ON `holidays` (`year`, `month`);
CREATE INDEX IF NOT EXISTS `idx_holidays_date`       ON `holidays` (`date`);
CREATE INDEX IF NOT EXISTS `idx_holidays_type`       ON `holidays` (`type`);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_holidays_unique` ON `holidays` (`date`, `type`, `name`);

CREATE TABLE IF NOT EXISTS `sources` (
  `id`          INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
  `year`        INTEGER  NOT NULL,
  `type`        TEXT     NOT NULL,
  `title`       TEXT     NOT NULL,
  `number`      TEXT,
  `issued_by`   TEXT     NOT NULL,
  `issued_date` TEXT     NOT NULL,
  `url`         TEXT     NOT NULL,
  `archive_url` TEXT,
  `local_pdf`   TEXT
);

CREATE INDEX IF NOT EXISTS `idx_sources_year` ON `sources` (`year`);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_sources_unique` ON `sources` (`year`, `type`, `number`);
