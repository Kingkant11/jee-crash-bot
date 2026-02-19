/**
 * SQLite Database Module
 * Handles all database operations for JEE Bot
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(__dirname, '../../database/jee-bot.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase();
  }
});

/**
 * Initialize database tables
 */
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_tests INTEGER DEFAULT 0,
        highest_score INTEGER DEFAULT 0,
        is_paid BOOLEAN DEFAULT 0,
        payment_date TIMESTAMP,
        referral_code TEXT UNIQUE,
        referred_by INTEGER
      )
    `, (err) => {
      if (err) console.error('❌ Error creating users table:', err.message);
      else console.log('✅ Users table ready');
    });

    // Tests table
    db.run(`
      CREATE TABLE IF NOT EXISTS tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        test_type TEXT DEFAULT 'diagnostic',
        questions JSON,
        answers JSON,
        score INTEGER,
        total_questions INTEGER,
        percentage REAL,
        analysis JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) console.error('❌ Error creating tests table:', err.message);
      else console.log('✅ Tests table ready');
    });

    // Progress table
    db.run(`
      CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject TEXT,
        chapter TEXT,
        topic TEXT,
        questions_attempted INTEGER DEFAULT 0,
        questions_correct INTEGER DEFAULT 0,
        last_attempted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, subject, chapter)
      )
    `, (err) => {
      if (err) console.error('❌ Error creating progress table:', err.message);
      else console.log('✅ Progress table ready');
    });

    // Question bank table
    db.run(`
      CREATE TABLE IF NOT EXISTS question_bank (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        options JSON NOT NULL,
        correct_answer INTEGER NOT NULL,
        subject TEXT NOT NULL,
        chapter TEXT NOT NULL,
        topic TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        tags TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('❌ Error creating question_bank table:', err.message);
      else console.log('✅ Question bank table ready');
    });

    // Create indexes for performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id)`, (err) => {
      if (err) console.error('❌ Error creating index:', err.message);
      else console.log('✅ Index: users.telegram_id');
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_tests_user_id ON tests(user_id)`, (err) => {
      if (err) console.error('❌ Error creating index:', err.message);
      else console.log('✅ Index: tests.user_id');
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id)`, (err) => {
      if (err) console.error('❌ Error creating index:', err.message);
      else console.log('✅ Index: progress.user_id');
    });

    console.log('✅ Database initialized successfully');
  });
}

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Get or create user by Telegram ID
 */
function getOrCreateUser(telegramId, userData) {
  return new Promise((resolve, reject) => {
    const { username, first_name, last_name } = userData;

    // First try to get existing user
    db.get(
      'SELECT * FROM users WHERE telegram_id = ?',
      [telegramId],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          // Update last_active
          db.run(
            'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?',
            [row.id]
          );
          resolve(row);
        } else {
          // Create new user
          const referralCode = generateReferralCode();
          db.run(
            'INSERT INTO users (telegram_id, username, first_name, last_name, referral_code) VALUES (?, ?, ?, ?, ?)',
            [telegramId, username, first_name, last_name, referralCode],
            function(err) {
              if (err) {
                reject(err);
              } else {
                // Return newly created user
                db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
                });
              }
            }
          );
        }
      }
    );
  });
}

/**
 * Update user payment status
 */
function updateUserPayment(userId) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET is_paid = 1, payment_date = CURRENT_TIMESTAMP WHERE id = ?',
      [userId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

/**
 * Get user stats
 */
function getUserStats(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE id = ?',
      [userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

// ============================================
// TEST OPERATIONS
// ============================================

/**
 * Save test result
 */
function saveTest(userId, testData) {
  return new Promise((resolve, reject) => {
    const { test_type, questions, answers, score, total_questions, percentage, analysis } = testData;

    db.run(
      `INSERT INTO tests (user_id, test_type, questions, answers, score, total_questions, percentage, analysis)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, test_type || 'diagnostic', JSON.stringify(questions), JSON.stringify(answers), score, total_questions, percentage, JSON.stringify(analysis)],
      function(err) {
        if (err) {
          reject(err);
        } else {
          // Update user stats
          db.run(
            'UPDATE users SET total_tests = total_tests + 1, highest_score = MAX(highest_score, ?) WHERE id = ?',
            [score, userId]
          );
          resolve(this.lastID);
        }
      }
    );
  });
}

/**
 * Get user's test history
 */
function getUserTests(userId, limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM tests WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit],
      (err, rows) => {
        if (err) reject(err);
        else {
          // Parse JSON fields
          rows = rows.map(row => ({
            ...row,
            questions: JSON.parse(row.questions),
            answers: JSON.parse(row.answers),
            analysis: JSON.parse(row.analysis)
          }));
          resolve(rows);
        }
      }
    );
  });
}

/**
 * Get user's best score
 */
function getBestScore(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT MAX(percentage) as best_score FROM tests WHERE user_id = ?',
      [userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row?.best_score || 0);
      }
    );
  });
}

// ============================================
// PROGRESS OPERATIONS
// ============================================

/**
 * Update progress for a subject/chapter
 */
function updateProgress(userId, question) {
  return new Promise((resolve, reject) => {
    const { subject, chapter, topic, is_correct } = question;

    // Check if progress exists
    db.get(
      'SELECT * FROM progress WHERE user_id = ? AND subject = ? AND chapter = ?',
      [userId, subject, chapter],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          // Update existing
          const incrementCorrected = is_correct ? 'questions_correct = questions_correct + 1' : 'questions_correct';
          db.run(
            `UPDATE progress SET
              questions_attempted = questions_attempted + 1,
              ${incrementCorrected},
              last_attempted = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [row.id],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        } else {
          // Create new
          db.run(
            'INSERT INTO progress (user_id, subject, chapter, topic, questions_attempted, questions_correct) VALUES (?, ?, ?, ?, 1, ?)',
            [userId, subject, chapter, topic, is_correct ? 1 : 0],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        }
      }
    );
  });

}

/**
 * Update progress for multiple questions (after test)
 */
function updateProgressBatch(userId, questions, answers, correctAnswers) {
  return new Promise((resolve, reject) => {
    const updates = questions.map((q, i) => {
      const isCorrect = answers[i] === q.ans;
      return {
        subject: q.subject,
        chapter: q.chapter,
        topic: q.topic,
        is_correct: isCorrect
      };
    });

    // Process all updates
    Promise.all(updates.map(u => updateProgress(userId, u)))
      .then(() => resolve())
      .catch(reject);
  });
}

/**
 * Get user's progress report
 */
function getProgressReport(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT
        subject,
        chapter,
        SUM(questions_attempted) as total_attempted,
        SUM(questions_correct) as total_correct,
        ROUND((SUM(questions_correct) * 100.0 / SUM(questions_attempted)), 2) as accuracy
      FROM progress
      WHERE user_id = ?
      GROUP BY subject, chapter
      ORDER BY accuracy ASC
      LIMIT 20`,
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

/**
 * Get user's weakest chapters
 */
function getWeakestChapters(userId, limit = 3) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT
        subject,
        chapter,
        SUM(questions_attempted) as total_attempted,
        SUM(questions_correct) as total_correct,
        ROUND((SUM(questions_correct) * 100.0 / SUM(questions_attempted)), 2) as accuracy
      FROM progress
      WHERE user_id = ? AND questions_attempted >= 3
      GROUP BY subject, chapter
      ORDER BY accuracy ASC
      LIMIT ?`,
      [userId, limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

// ============================================
// QUESTION BANK OPERATIONS
// ============================================

/**
 * Save questions to bank
 */
function saveQuestionsToBank(questions) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
      'INSERT INTO question_bank (question, options, correct_answer, subject, chapter, topic, difficulty, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const insertMany = questions.map(q => {
      return new Promise((res, rej) => {
        stmt.run(
          [
            q.q,
            JSON.stringify(q.options),
            q.ans,
            q.subject,
            q.chapter,
            q.topic,
            q.difficulty,
            JSON.stringify(q.tags || [])
          ],
          function(err) {
            if (err) rej(err);
            else res(this.lastID);
          }
        );
      });
    });

    Promise.all(insertMany)
      .then(ids => {
        stmt.finalize();
        resolve(ids);
      })
      .catch(err => {
        stmt.finalize();
        reject(err);
      });
  });
}

/**
 * Get questions from bank
 */
function getQuestionsFromBank(criteria = {}) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM question_bank WHERE 1=1';
    const params = [];

    if (criteria.subject) {
      query += ' AND subject = ?';
      params.push(criteria.subject);
    }

    if (criteria.chapter) {
      query += ' AND chapter = ?';
      params.push(criteria.chapter);
    }

    if (criteria.difficulty) {
      query += ' AND difficulty = ?';
      params.push(criteria.difficulty);
    }

    query += ' ORDER BY RANDOM() LIMIT ?';
    params.push(criteria.limit || 10);

    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else {
        rows = rows.map(row => ({
          id: row.id,
          q: row.question,
          options: JSON.parse(row.options),
          ans: row.correct_answer,
          subject: row.subject,
          chapter: row.chapter,
          topic: row.topic,
          difficulty: row.difficulty,
          tags: JSON.parse(row.tags || '[]')
        }));
        resolve(rows);
      }
    });
  });
}

// ============================================
// UTILITIES
// ============================================

/**
 * Generate unique referral code
 */
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Close database connection
 */
function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err.message);
    } else {
      console.log('✅ Database connection closed');
    }
  });
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  getOrCreateUser,
  updateUserPayment,
  getUserStats,
  saveTest,
  getUserTests,
  getBestScore,
  updateProgress,
  updateProgressBatch,
  getProgressReport,
  getWeakestChapters,
  saveQuestionsToBank,
  getQuestionsFromBank,
  closeDatabase
};
