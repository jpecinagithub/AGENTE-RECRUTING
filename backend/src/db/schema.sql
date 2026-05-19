CREATE DATABASE IF NOT EXISTS recruiting_agent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE recruiting_agent;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  roles JSON COMMENT 'e.g. ["Software Engineer", "Backend Developer"]',
  salary_min INT,
  salary_max INT,
  salary_currency VARCHAR(10) DEFAULT 'EUR',
  locations JSON COMMENT 'e.g. ["Madrid", "Barcelona", "Remote"]',
  remote_only BOOLEAN DEFAULT FALSE,
  keywords JSON COMMENT 'e.g. ["Python", "React", "AWS"]',
  excluded_companies JSON,
  excluded_keywords JSON,
  raw_preferences TEXT COMMENT 'Free-text summary of all preferences',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  metadata JSON COMMENT 'tool calls, job cards, etc.',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  type ENUM('scraper', 'api') DEFAULT 'scraper',
  config JSON COMMENT 'CSS selectors or API config',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  source_id INT,
  title VARCHAR(500) NOT NULL,
  company VARCHAR(255),
  location VARCHAR(255),
  salary VARCHAR(255),
  description TEXT,
  apply_url VARCHAR(500),
  relevance_score FLOAT DEFAULT 0,
  is_saved BOOLEAN DEFAULT FALSE,
  feedback ENUM('relevant', 'not_relevant') DEFAULT NULL,
  found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES job_sources(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS agent_memory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('preference', 'feedback', 'search_history', 'inferred') NOT NULL,
  key_name VARCHAR(255),
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Default job sources (available to all users after setup)
INSERT IGNORE INTO job_sources (user_id, name, url, type, config) VALUES
(1, 'InfoJobs', 'https://www.infojobs.net', 'scraper', '{"selectors": {"job": ".ij-OfferCard", "title": ".ij-OfferCard-title", "company": ".ij-OfferCard-subtitle", "location": ".ij-OfferCard-location", "link": "a"}}'),
(1, 'Tecnoempleo', 'https://www.tecnoempleo.com', 'scraper', '{"selectors": {"job": ".oferta", "title": ".titulo", "company": ".empresa", "location": ".ubicacion", "link": "a"}}');
