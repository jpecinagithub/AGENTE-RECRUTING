import { query, queryOne } from './connection.js'

// ─── Users ────────────────────────────────────────────────────────────────────
export const Users = {
  findByEmail: (email) => queryOne('SELECT * FROM users WHERE email = ?', [email]),
  findById: (id) => queryOne('SELECT id, email, name, created_at FROM users WHERE id = ?', [id]),
  create: async (email, passwordHash, name) => {
    const result = await query('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)', [email, passwordHash, name])
    return result.insertId
  },
}

// ─── Preferences ─────────────────────────────────────────────────────────────
export const Preferences = {
  getByUser: (userId) => queryOne('SELECT * FROM user_preferences WHERE user_id = ?', [userId]),
  upsert: async (userId, prefs) => {
    const existing = await Preferences.getByUser(userId)
    if (existing) {
      await query(
        `UPDATE user_preferences SET roles=?, salary_min=?, salary_max=?, locations=?, remote_only=?,
         keywords=?, excluded_companies=?, excluded_keywords=?, raw_preferences=? WHERE user_id=?`,
        [
          JSON.stringify(prefs.roles || []),
          prefs.salary_min || null,
          prefs.salary_max || null,
          JSON.stringify(prefs.locations || []),
          prefs.remote_only || false,
          JSON.stringify(prefs.keywords || []),
          JSON.stringify(prefs.excluded_companies || []),
          JSON.stringify(prefs.excluded_keywords || []),
          prefs.raw_preferences || null,
          userId,
        ]
      )
    } else {
      await query(
        `INSERT INTO user_preferences (user_id, roles, salary_min, salary_max, locations, remote_only,
         keywords, excluded_companies, excluded_keywords, raw_preferences)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          JSON.stringify(prefs.roles || []),
          prefs.salary_min || null,
          prefs.salary_max || null,
          JSON.stringify(prefs.locations || []),
          prefs.remote_only || false,
          JSON.stringify(prefs.keywords || []),
          JSON.stringify(prefs.excluded_companies || []),
          JSON.stringify(prefs.excluded_keywords || []),
          prefs.raw_preferences || null,
        ]
      )
    }
    return Preferences.getByUser(userId)
  },
}

// ─── Conversations & Messages ─────────────────────────────────────────────────
export const Conversations = {
  create: async (userId, title = 'New Conversation') => {
    const result = await query('INSERT INTO conversations (user_id, title) VALUES (?, ?)', [userId, title])
    return result.insertId
  },
  getByUser: (userId) => query('SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC', [userId]),
  findById: (id) => queryOne('SELECT * FROM conversations WHERE id = ?', [id]),
}

export const Messages = {
  create: async (conversationId, userId, role, content, metadata = null) => {
    const result = await query(
      'INSERT INTO messages (conversation_id, user_id, role, content, metadata) VALUES (?, ?, ?, ?, ?)',
      [conversationId, userId, role, content, metadata ? JSON.stringify(metadata) : null]
    )
    return result.insertId
  },
  getByConversation: (conversationId, limit = 50) =>
    query('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?', [conversationId, parseInt(limit)]),
  getRecentByUser: (userId, limit = 20) =>
    query(
      `SELECT m.* FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE c.user_id = ? ORDER BY m.created_at DESC LIMIT ?`,
      [userId, parseInt(limit)]
    ),
}

// ─── Job Sources ──────────────────────────────────────────────────────────────
export const JobSources = {
  getByUser: (userId) => query('SELECT * FROM job_sources WHERE user_id = ? AND is_active = 1', [userId]),
  getAll: () => query('SELECT * FROM job_sources WHERE is_active = 1'),
  create: async (userId, name, url, type, config) => {
    const result = await query(
      'INSERT INTO job_sources (user_id, name, url, type, config) VALUES (?, ?, ?, ?, ?)',
      [userId, name, url, type, JSON.stringify(config)]
    )
    return result.insertId
  },
  delete: (id, userId) => query('UPDATE job_sources SET is_active = 0 WHERE id = ? AND user_id = ?', [id, userId]),
}

// ─── Job Listings ─────────────────────────────────────────────────────────────
export const JobListings = {
  getByUser: (userId, { limit = 50, savedOnly = false } = {}) => {
    const where = savedOnly ? 'AND is_saved = 1' : ''
    return query(
      `SELECT j.*, js.name as source_name FROM job_listings j
       LEFT JOIN job_sources js ON js.id = j.source_id
       WHERE j.user_id = ? ${where} ORDER BY j.relevance_score DESC, j.found_at DESC LIMIT ?`,
      [userId, parseInt(limit)]
    )
  },
  create: async (userId, sourceId, job) => {
    const result = await query(
      `INSERT INTO job_listings (user_id, source_id, title, company, location, salary, description, apply_url, relevance_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, sourceId, job.title, job.company, job.location, job.salary, job.description, job.apply_url, job.relevance_score || 0]
    )
    return result.insertId
  },
  save: (id, userId) => query('UPDATE job_listings SET is_saved = 1 WHERE id = ? AND user_id = ?', [id, userId]),
  feedback: (id, userId, feedback) =>
    query('UPDATE job_listings SET feedback = ? WHERE id = ? AND user_id = ?', [feedback, id, userId]),
  getToday: (userId) =>
    query(
      `SELECT * FROM job_listings WHERE user_id = ? AND DATE(found_at) = CURDATE() ORDER BY relevance_score DESC`,
      [userId]
    ),
}

// ─── Agent Memory ─────────────────────────────────────────────────────────────
export const AgentMemory = {
  getByUser: (userId, type = null) => {
    if (type) return query('SELECT * FROM agent_memory WHERE user_id = ? AND type = ? ORDER BY updated_at DESC', [userId, type])
    return query('SELECT * FROM agent_memory WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50', [userId])
  },
  upsert: async (userId, type, keyName, value) => {
    const existing = await queryOne(
      'SELECT id FROM agent_memory WHERE user_id = ? AND type = ? AND key_name = ?',
      [userId, type, keyName]
    )
    if (existing) {
      await query('UPDATE agent_memory SET value = ? WHERE id = ?', [value, existing.id])
    } else {
      await query('INSERT INTO agent_memory (user_id, type, key_name, value) VALUES (?, ?, ?, ?)', [userId, type, keyName, value])
    }
  },
}
