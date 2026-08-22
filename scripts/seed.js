const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'skillswap.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 1. Create Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STUDENT',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    campus_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    college TEXT,
    major TEXT,
    year TEXT,
    is_verified_student INTEGER NOT NULL DEFAULT 0,
    trust_score REAL NOT NULL DEFAULT 70.0,
    completion_rate REAL NOT NULL DEFAULT 100.0,
    cancellation_rate REAL NOT NULL DEFAULT 0.0,
    hourly_rate_credits INTEGER NOT NULL DEFAULT 1,
    teaching_style TEXT DEFAULT 'Interactive & Hands-on',
    languages TEXT DEFAULT 'English',
    profile_visibility TEXT DEFAULT 'PUBLIC',
    ml_consent INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    icon TEXT DEFAULT 'BookOpen',
    description TEXT,
    is_verified INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_skills (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    proficiency TEXT NOT NULL,
    experience_years REAL DEFAULT 1.0,
    teaching_style TEXT DEFAULT 'Hands-on project based',
    verification_status TEXT NOT NULL DEFAULT 'CLAIMED',
    evidence_url TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS learning_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    target_proficiency TEXT NOT NULL DEFAULT 'Intermediate',
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS availability_slots (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    learner_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'REQUESTED',
    scheduled_start DATETIME NOT NULL,
    scheduled_end DATETIME NOT NULL,
    duration_hours REAL NOT NULL DEFAULT 1.0,
    credits_amount INTEGER NOT NULL DEFAULT 1,
    mode TEXT NOT NULL DEFAULT 'ONLINE',
    location_or_url TEXT DEFAULT 'https://meet.skillswap.internal/room',
    learner_confirmed INTEGER NOT NULL DEFAULT 0,
    teacher_confirmed INTEGER NOT NULL DEFAULT 0,
    idempotency_key TEXT UNIQUE NOT NULL,
    notes TEXT,
    cancellation_reason TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (skill_id) REFERENCES skills(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id),
    FOREIGN KEY (learner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS skill_credit_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    balance INTEGER NOT NULL DEFAULT 3,
    escrow_balance INTEGER NOT NULL DEFAULT 0,
    lifetime_earned INTEGER NOT NULL DEFAULT 0,
    lifetime_spent INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY,
    reference_session_id TEXT,
    sender_id TEXT,
    receiver_id TEXT,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SETTLED',
    idempotency_key TEXT UNIQUE NOT NULL,
    on_chain_tx_hash TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reference_session_id) REFERENCES sessions(id),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ratings (
    id TEXT PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    rater_id TEXT NOT NULL,
    ratee_id TEXT NOT NULL,
    score REAL NOT NULL CHECK(score >= 1.0 AND score <= 5.0),
    review TEXT,
    skills_demonstrated TEXT,
    punctuality_score REAL DEFAULT 5.0,
    clarity_score REAL DEFAULT 5.0,
    flagged_suspicious INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (rater_id) REFERENCES users(id),
    FOREIGN KEY (ratee_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reputations (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    total_sessions_taught INTEGER NOT NULL DEFAULT 0,
    total_sessions_learned INTEGER NOT NULL DEFAULT 0,
    bayesian_rating REAL NOT NULL DEFAULT 4.5,
    reliability_score REAL NOT NULL DEFAULT 95.0,
    teaching_score REAL NOT NULL DEFAULT 90.0,
    reciprocal_rating_ratio REAL NOT NULL DEFAULT 0.0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS credentials (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    badge_type TEXT NOT NULL,
    skill_id TEXT,
    token_id TEXT,
    tx_hash TEXT,
    criteria_met TEXT NOT NULL,
    is_revoked INTEGER NOT NULL DEFAULT 0,
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    reported_id TEXT NOT NULL,
    session_id TEXT,
    reason TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    resolution_notes TEXT,
    moderator_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (reported_id) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );

  CREATE TABLE IF NOT EXISTS disputes (
    id TEXT PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    initiator_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    evidence_url TEXT,
    moderator_id TEXT,
    resolution_notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (initiator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fraud_alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    risk_score REAL NOT NULL,
    risk_level TEXT NOT NULL,
    anomaly_reasons TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    reviewed_by TEXT,
    review_notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    previous_state TEXT,
    new_state TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INFO',
    link TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    address TEXT UNIQUE NOT NULL,
    chain_id INTEGER NOT NULL DEFAULT 31337,
    signature_proof TEXT NOT NULL,
    is_verified INTEGER NOT NULL DEFAULT 1,
    linked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id TEXT PRIMARY KEY,
    reference_type TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    contract_address TEXT NOT NULL,
    tx_hash TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONFIRMED',
    block_number INTEGER,
    payload_json TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS study_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    meeting_schedule TEXT DEFAULT 'Every Wednesday 5 PM',
    max_members INTEGER NOT NULL DEFAULT 8,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS study_group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MEMBER',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS study_resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    author_id TEXT NOT NULL,
    resource_type TEXT NOT NULL DEFAULT 'PDF',
    file_url TEXT,
    upvotes INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS flashcard_decks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    cards_count INTEGER NOT NULL DEFAULT 0,
    is_public INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    mastery_level INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS exchange_proposals (
    id TEXT PRIMARY KEY,
    cycle_hash TEXT UNIQUE NOT NULL,
    participants_json TEXT NOT NULL,
    skills_flow_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PROPOSED',
    accepted_users_json TEXT NOT NULL DEFAULT '[]',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
  );
`);

async function seed() {
  console.log('Seeding database with synthetic campus data...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Skills Master
  const skillsData = [
    { id: 'skill-python', name: 'Python Programming', category: 'Computer Science', icon: 'Code', description: 'Core Python, scripting, data pipelines, and backend APIs' },
    { id: 'skill-react', name: 'React & Next.js', category: 'Computer Science', icon: 'Layout', description: 'Component architecture, state management, hooks, and SSR' },
    { id: 'skill-solidity', name: 'Solidity & Smart Contracts', category: 'Computer Science', icon: 'Cpu', description: 'EVM smart contract engineering, testing, and security' },
    { id: 'skill-ml', name: 'Machine Learning & PyTorch', category: 'Computer Science', icon: 'Brain', description: 'Supervised/unsupervised ML, scikit-learn, deep learning basics' },
    { id: 'skill-dsa', name: 'Data Structures & Algorithms', category: 'Computer Science', icon: 'Binary', description: 'Trees, graphs, dynamic programming, interview problem solving' },
    { id: 'skill-figma', name: 'UI/UX Design & Figma', category: 'Design', icon: 'PenTool', description: 'Design systems, interactive prototyping, user research, wireframing' },
    { id: 'skill-spanish', name: 'Spanish Conversation', category: 'Languages', icon: 'Languages', description: 'Conversational fluency, vocabulary, pronunciation, culture' },
    { id: 'skill-calculus', name: 'Calculus & Linear Algebra', category: 'Mathematics', icon: 'Sigma', description: 'Derivatives, integrals, multivariable calculus, matrix algebra' },
    { id: 'skill-finance', name: 'Corporate Finance & Valuation', category: 'Business', icon: 'TrendingUp', description: 'Financial modeling, DCF valuation, capital budgeting' },
    { id: 'skill-node', name: 'Node.js & Express Backend', category: 'Computer Science', icon: 'Server', description: 'REST APIs, middleware, authentication, and database integration' },
  ];

  for (const s of skillsData) {
    db.prepare(`
      INSERT OR REPLACE INTO skills (id, name, category, icon, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(s.id, s.name, s.category, s.icon, s.description);
  }

  // 2. Student Personas
  const students = [
    {
      id: 'usr-alice',
      email: 'alice@campus.edu',
      role: 'STUDENT',
      displayName: 'Alice Chen',
      college: 'School of Engineering',
      major: 'Computer Science',
      year: 'Junior',
      bio: 'Junior CS student passionate about fullstack web apps and decentralized systems. Looking to master Solidity!',
      isVerified: 1,
      trustScore: 92.0,
      balance: 4,
      teaching: [
        { skillId: 'skill-react', proficiency: 'Advanced', exp: 2.5, style: 'Hands-on project reviews & coding sessions', status: 'PLATFORM_VERIFIED' },
        { skillId: 'skill-node', proficiency: 'Intermediate', exp: 1.5, style: 'API building workshops', status: 'PEER_VERIFIED' },
      ],
      goals: [
        { skillId: 'skill-solidity', target: 'Intermediate', priority: 'HIGH', notes: 'Want to build DeFi and credential contracts for senior project' },
      ],
      availability: [
        { day: 'Tuesday', start: '18:00', end: '20:00' },
        { day: 'Thursday', start: '18:00', end: '20:00' },
        { day: 'Saturday', start: '14:00', end: '17:00' },
      ],
      reputation: { taught: 8, learned: 5, rating: 4.8, reliability: 98, reviews: 7 },
    },
    {
      id: 'usr-rahul',
      email: 'rahul.kumar@campus.edu',
      role: 'STUDENT',
      displayName: 'Rahul Kumar',
      college: 'School of Engineering',
      major: 'Computer Science & AI',
      year: 'Senior',
      bio: 'Senior developer specializing in Python data engineering, ML pipelines, and Solidity smart contracts.',
      isVerified: 1,
      trustScore: 96.0,
      balance: 6,
      teaching: [
        { skillId: 'skill-python', proficiency: 'Expert', exp: 3.5, style: 'Deep dive into architecture, debugging & best practices', status: 'PLATFORM_VERIFIED' },
        { skillId: 'skill-solidity', proficiency: 'Advanced', exp: 2.0, style: 'Smart contract security audits and Hardhat testing', status: 'PLATFORM_VERIFIED' },
        { skillId: 'skill-ml', proficiency: 'Intermediate', exp: 2.0, style: 'Practical PyTorch modeling', status: 'PEER_VERIFIED' },
      ],
      goals: [
        { skillId: 'skill-figma', target: 'Intermediate', priority: 'HIGH', notes: 'Need better UI/UX skills for my open-source projects' },
      ],
      availability: [
        { day: 'Tuesday', start: '18:00', end: '21:00' },
        { day: 'Thursday', start: '18:00', end: '21:00' },
        { day: 'Sunday', start: '11:00', end: '15:00' },
      ],
      reputation: { taught: 27, learned: 12, rating: 4.9, reliability: 99, reviews: 24 },
    },
    {
      id: 'usr-elena',
      email: 'elena.rostova@campus.edu',
      role: 'STUDENT',
      displayName: 'Elena Rostova',
      college: 'School of Design',
      major: 'Digital Media & UI/UX',
      year: 'Senior',
      bio: 'Product designer focusing on accessible design systems and sleek web interfaces. Looking to learn Python for data visualization!',
      isVerified: 1,
      trustScore: 94.0,
      balance: 5,
      teaching: [
        { skillId: 'skill-figma', proficiency: 'Expert', exp: 4.0, style: 'Figma component mastery, auto-layout, and interactive prototypes', status: 'PLATFORM_VERIFIED' },
      ],
      goals: [
        { skillId: 'skill-python', target: 'Intermediate', priority: 'HIGH', notes: 'Need Python data scripts for UX analytics' },
      ],
      availability: [
        { day: 'Tuesday', start: '18:00', end: '20:00' },
        { day: 'Wednesday', start: '17:00', end: '19:00' },
        { day: 'Saturday', start: '13:00', end: '16:00' },
      ],
      reputation: { taught: 19, learned: 8, rating: 4.9, reliability: 97, reviews: 18 },
    },
    {
      id: 'usr-david',
      email: 'david.kim@campus.edu',
      role: 'STUDENT',
      displayName: 'David Kim',
      college: 'College of Arts & Sciences',
      major: 'Applied Mathematics',
      year: 'Junior',
      bio: 'Math and stats tutor. I simplify complex calculus proofs, matrix algebra, and algorithmic foundations.',
      isVerified: 1,
      trustScore: 90.0,
      balance: 3,
      teaching: [
        { skillId: 'skill-calculus', proficiency: 'Expert', exp: 3.0, style: 'Step-by-step problem walkthroughs and intuitive proofs', status: 'PLATFORM_VERIFIED' },
        { skillId: 'skill-dsa', proficiency: 'Advanced', exp: 2.0, style: 'Algorithmic complexity & dynamic programming', status: 'PEER_VERIFIED' },
      ],
      goals: [
        { skillId: 'skill-react', target: 'Intermediate', priority: 'MEDIUM', notes: 'Want to build interactive math visualizers on the web' },
      ],
      availability: [
        { day: 'Monday', start: '16:00', end: '19:00' },
        { day: 'Wednesday', start: '16:00', end: '19:00' },
        { day: 'Friday', start: '15:00', end: '18:00' },
      ],
      reputation: { taught: 14, learned: 6, rating: 4.7, reliability: 95, reviews: 12 },
    },
    {
      id: 'usr-sofia',
      email: 'sofia.garcia@campus.edu',
      role: 'STUDENT',
      displayName: 'Sofia Garcia',
      college: 'Faculty of Humanities',
      major: 'Modern Languages & Linguistics',
      year: 'Sophomore',
      bio: 'Native Spanish speaker and linguistic enthusiast. I teach fluent conversational Spanish, grammar nuances, and pronunciation.',
      isVerified: 1,
      trustScore: 88.0,
      balance: 3,
      teaching: [
        { skillId: 'skill-spanish', proficiency: 'Expert', exp: 5.0, style: 'Immersive dialogues, cultural idioms, and active speech', status: 'PLATFORM_VERIFIED' },
      ],
      goals: [
        { skillId: 'skill-python', target: 'Beginner', priority: 'HIGH', notes: 'Want to learn Python for computational linguistics' },
      ],
      availability: [
        { day: 'Monday', start: '18:00', end: '20:00' },
        { day: 'Thursday', start: '18:00', end: '20:00' },
      ],
      reputation: { taught: 10, learned: 4, rating: 4.9, reliability: 96, reviews: 9 },
    },
    {
      id: 'usr-suspect-1',
      email: 'botfarm1@external-temp.net',
      role: 'STUDENT',
      displayName: 'QuickSwap Pro',
      college: 'Unknown Faculty',
      major: 'General Studies',
      year: 'Freshman',
      bio: 'Instant skill swaps and guaranteed 5 star reviews.',
      isVerified: 0,
      trustScore: 42.0,
      balance: 15,
      teaching: [
        { skillId: 'skill-python', proficiency: 'Expert', exp: 1.0, style: 'Fast sessions', status: 'CLAIMED' },
      ],
      goals: [
        { skillId: 'skill-react', target: 'Expert', priority: 'HIGH', notes: 'Farming credits' },
      ],
      availability: [
        { day: 'Monday', start: '00:00', end: '23:59' },
      ],
      reputation: { taught: 18, learned: 18, rating: 5.0, reliability: 60, reviews: 18 },
    },
    {
      id: 'usr-mod-sarah',
      email: 'moderator.sarah@campus.edu',
      role: 'MODERATOR',
      displayName: 'Sarah Jenkins',
      college: 'Student Affairs & Honor Council',
      major: 'Campus Leadership',
      year: 'Graduate',
      bio: 'Official Campus Peer Learning Moderator. Reviewing dispute evidence, fraud signals, and credential standards.',
      isVerified: 1,
      trustScore: 99.0,
      balance: 10,
      teaching: [],
      goals: [],
      availability: [],
      reputation: { taught: 0, learned: 0, rating: 5.0, reliability: 100, reviews: 0 },
    },
    {
      id: 'usr-admin',
      email: 'admin@skillswap.campus.edu',
      role: 'ADMIN',
      displayName: 'Campus Admin',
      college: 'IT & Infrastructure Services',
      major: 'System Administration',
      year: 'Staff',
      bio: 'Principal administrator overseeing platform security, smart contracts, emergency pause, and audit logs.',
      isVerified: 1,
      trustScore: 100.0,
      balance: 100,
      teaching: [],
      goals: [],
      availability: [],
      reputation: { taught: 0, learned: 0, rating: 5.0, reliability: 100, reviews: 0 },
    },
  ];

  for (const stu of students) {
    db.prepare(`
      INSERT OR REPLACE INTO users (id, email, password_hash, role, status, campus_id)
      VALUES (?, ?, ?, ?, 'ACTIVE', ?)
    `).run(stu.id, stu.email, passwordHash, stu.role, `STU-${stu.id.replace('usr-', '').toUpperCase()}`);

    db.prepare(`
      INSERT OR REPLACE INTO profiles (
        id, user_id, display_name, bio, college, major, year, is_verified_student, trust_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `prof-${stu.id}`,
      stu.id,
      stu.displayName,
      stu.bio,
      stu.college,
      stu.major,
      stu.year,
      stu.isVerified,
      stu.trustScore
    );

    db.prepare(`
      INSERT OR REPLACE INTO skill_credit_accounts (id, user_id, balance, escrow_balance, lifetime_earned, lifetime_spent)
      VALUES (?, ?, ?, 0, ?, ?)
    `).run(`acc-${stu.id}`, stu.id, stu.balance, stu.reputation.taught, stu.reputation.learned);

    db.prepare(`
      INSERT OR REPLACE INTO reputations (
        id, user_id, total_reviews, total_sessions_taught, total_sessions_learned, bayesian_rating, reliability_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `rep-${stu.id}`,
      stu.id,
      stu.reputation.reviews,
      stu.reputation.taught,
      stu.reputation.learned,
      stu.reputation.rating,
      stu.reputation.reliability
    );

    for (const t of stu.teaching) {
      db.prepare(`
        INSERT OR REPLACE INTO user_skills (id, user_id, skill_id, proficiency, experience_years, teaching_style, verification_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(`usk-${stu.id}-${t.skillId}`, stu.id, t.skillId, t.proficiency, t.exp, t.style, t.status);
    }

    for (const g of stu.goals) {
      db.prepare(`
        INSERT OR REPLACE INTO learning_goals (id, user_id, skill_id, target_proficiency, priority, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(`goal-${stu.id}-${g.skillId}`, stu.id, g.skillId, g.target, g.priority, g.notes);
    }

    for (const a of stu.availability) {
      db.prepare(`
        INSERT OR REPLACE INTO availability_slots (id, user_id, day_of_week, start_time, end_time)
        VALUES (?, ?, ?, ?, ?)
      `).run(`avail-${stu.id}-${a.day}`, stu.id, a.day, a.start, a.end);
    }
  }

  // Verifiable Credential for Rahul
  db.prepare(`
    INSERT OR REPLACE INTO credentials (id, user_id, title, badge_type, skill_id, token_id, tx_hash, criteria_met)
    VALUES ('cred-rahul-python-1', 'usr-rahul', 'Python Mentor — Level 1', 'MENTOR_TIER_1', 'skill-python', 'CERT-8841', '0x8f28c11e72e128b9d3b4a2e5d6c8109923847162901928374615243123456789', ?)
  `).run(JSON.stringify({ sessionsTaught: 27, bayesianRating: 4.9, minSessionsRequired: 3, minRatingRequired: 4.5 }));

  // StudySphere Groups & Resources
  db.prepare(`
    INSERT OR REPLACE INTO study_groups (id, name, description, subject, creator_id, meeting_schedule, max_members)
    VALUES 
    ('grp-1', 'Web3 & EVM Builders Circle', 'Weekly collaboration on Solidity smart contracts and hardhat testing.', 'Computer Science', 'usr-rahul', 'Thursdays 7:00 PM', 10),
    ('grp-2', 'Figma Design System Jam', 'Hands-on critique and design system token standardization sessions.', 'Design', 'usr-elena', 'Wednesdays 6:00 PM', 8)
  `).run();

  db.prepare(`
    INSERT OR REPLACE INTO study_resources (id, title, description, subject, author_id, resource_type, file_url, upvotes)
    VALUES 
    ('res-1', 'Smart Contract Security Audit Checklist', 'Comprehensive checklist covering reentrancy, integer overflow, and access control.', 'Computer Science', 'usr-rahul', 'PDF', 'https://docs.skillswap.internal/evm-security.pdf', 34),
    ('res-2', 'React 18 Server Components Cheat Sheet', 'Visual guide to hydration boundaries and Suspense patterns.', 'Computer Science', 'usr-alice', 'NOTES', 'https://docs.skillswap.internal/react-cheatsheet.pdf', 28)
  `).run();

  db.prepare(`
    INSERT OR REPLACE INTO flashcard_decks (id, user_id, title, subject, cards_count, is_public)
    VALUES ('deck-1', 'usr-rahul', 'Solidity & EVM Opcodes Master Deck', 'Computer Science', 3, 1)
  `).run();

  db.prepare(`
    INSERT OR REPLACE INTO flashcards (id, deck_id, front, back, mastery_level)
    VALUES 
    ('fc-1', 'deck-1', 'What is the Checks-Effects-Interactions pattern in Solidity?', 'A security pattern where state checks occur first, internal state modifications second, and external contract calls last to prevent reentrancy attacks.', 4),
    ('fc-2', 'deck-1', 'What is the gas cost difference between storage and memory?', 'Storage writes are permanent and cost up to 20,000 gas (SSTORE), while memory is temporary and costs very little gas.', 3),
    ('fc-3', 'deck-1', 'Why should tx.origin never be used for authorization?', 'tx.origin returns the original EOA that initiated the call chain, making it vulnerable to phishing contract attacks. Always use msg.sender.', 5)
  `).run();

  // Fraud Alert for Suspect-1
  db.prepare(`
    INSERT OR REPLACE INTO fraud_alerts (id, user_id, risk_score, risk_level, anomaly_reasons, status)
    VALUES ('alert-suspect-1', 'usr-suspect-1', 88.0, 'HIGH', ?, 'PENDING_REVIEW')
  `).run(JSON.stringify([
    'High reciprocal rating loop detected (100% mutual 5-star reviews with usr-suspect-2)',
    'Rapid credit velocity: 10 transactions in <24h',
    'Unverified campus identity status'
  ]));

  console.log('SkillSwap Campus synthetic database seeding successfully complete!');
}

seed().catch(console.error);
