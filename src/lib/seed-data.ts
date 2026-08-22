import bcrypt from 'bcryptjs';
import { getDb } from './db';
import crypto from 'crypto';

export async function seedDatabase() {
  const db = getDb();

  // Check if already seeded
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  if (userCount > 5) {
    console.log(`Database already populated with ${userCount} users. Skipping initial seed.`);
    return;
  }

  console.log('Seeding SkillSwap Campus database with synthetic campus data...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Skills Master Catalog
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

  const insertSkill = db.prepare(`
    INSERT OR IGNORE INTO skills (id, name, category, icon, description)
    VALUES (@id, @name, @category, @icon, @description)
  `);

  for (const s of skillsData) {
    insertSkill.run(s);
  }

  // 2. Synthetic Student Personas
  const students = [
    // Primary Demo Personas
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
      id: 'usr-marcus',
      email: 'marcus.vance@campus.edu',
      role: 'STUDENT',
      displayName: 'Marcus Vance',
      college: 'School of Business',
      major: 'Finance & Analytics',
      year: 'Senior',
      bio: 'Incoming investment banking analyst. Can tutor in discounted cash flow modeling, LBO models, and corporate valuation.',
      isVerified: 1,
      trustScore: 89.0,
      balance: 4,
      teaching: [
        { skillId: 'skill-finance', proficiency: 'Advanced', exp: 2.5, style: 'Real-world Excel financial modeling', status: 'PLATFORM_VERIFIED' },
      ],
      goals: [
        { skillId: 'skill-python', target: 'Intermediate', priority: 'HIGH', notes: 'Algorithmic trading scripts' },
      ],
      availability: [
        { day: 'Friday', start: '17:00', end: '20:00' },
        { day: 'Sunday', start: '14:00', end: '18:00' },
      ],
      reputation: { taught: 11, learned: 7, rating: 4.8, reliability: 94, reviews: 10 },
    },

    // Suspicious Ring Accounts (for Fraud & Moderation Demo)
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
      id: 'usr-suspect-2',
      email: 'botfarm2@external-temp.net',
      role: 'STUDENT',
      displayName: 'Credit Boost Service',
      college: 'Unknown Faculty',
      major: 'General Studies',
      year: 'Freshman',
      bio: 'Reciprocal trade partner.',
      isVerified: 0,
      trustScore: 40.0,
      balance: 16,
      teaching: [
        { skillId: 'skill-react', proficiency: 'Expert', exp: 1.0, style: 'Fast sessions', status: 'CLAIMED' },
      ],
      goals: [
        { skillId: 'skill-python', target: 'Expert', priority: 'HIGH', notes: 'Farming credits' },
      ],
      availability: [
        { day: 'Monday', start: '00:00', end: '23:59' },
      ],
      reputation: { taught: 18, learned: 18, rating: 5.0, reliability: 60, reviews: 18 },
    },

    // Campus Staff / Moderator & Admin
    {
      id: 'usr-mod-sarah',
      email: 'moderator.sarah@campus.edu',
      role: 'MODERATOR',
      displayName: 'Sarah Jenkins (Campus Moderator)',
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
      displayName: 'Campus Admin & SRE',
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

  // Insert Users, Profiles, Accounts, Reputations
  for (const stu of students) {
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, role, status, campus_id)
      VALUES (?, ?, ?, ?, 'ACTIVE', ?)
    `).run(stu.id, stu.email, passwordHash, stu.role, `STU-${stu.id.replace('usr-', '').toUpperCase()}`);

    db.prepare(`
      INSERT OR IGNORE INTO profiles (
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
      INSERT OR IGNORE INTO skill_credit_accounts (id, user_id, balance, escrow_balance, lifetime_earned, lifetime_spent)
      VALUES (?, ?, ?, 0, ?, ?)
    `).run(`acc-${stu.id}`, stu.id, stu.balance, stu.reputation.taught, stu.reputation.learned);

    db.prepare(`
      INSERT OR IGNORE INTO reputations (
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

    // Insert Teaching Skills
    for (const t of stu.teaching) {
      db.prepare(`
        INSERT OR IGNORE INTO user_skills (id, user_id, skill_id, proficiency, experience_years, teaching_style, verification_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `usk-${stu.id}-${t.skillId}`,
        stu.id,
        t.skillId,
        t.proficiency,
        t.exp,
        t.style,
        t.status
      );
    }

    // Insert Goals
    for (const g of stu.goals) {
      db.prepare(`
        INSERT OR IGNORE INTO learning_goals (id, user_id, skill_id, target_proficiency, priority, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `goal-${stu.id}-${g.skillId}`,
        stu.id,
        g.skillId,
        g.target,
        g.priority,
        g.notes
      );
    }

    // Insert Availability
    for (const a of stu.availability) {
      db.prepare(`
        INSERT OR IGNORE INTO availability_slots (id, user_id, day_of_week, start_time, end_time)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        `avail-${stu.id}-${a.day}`,
        stu.id,
        a.day,
        a.start,
        a.end
      );
    }
  }

  // 3. Seed Existing Completed Sessions & Verifiable Credentials
  const rahulTxHash = '0x8f28c11e72e128b9d3b4a2e5d6c8109923847162901928374615243123456789';
  db.prepare(`
    INSERT OR IGNORE INTO credentials (id, user_id, title, badge_type, skill_id, token_id, tx_hash, criteria_met)
    VALUES (?, 'usr-rahul', 'Python Mentor — Level 1', 'MENTOR_TIER_1', 'skill-python', 'CERT-8841', ?, ?)
  `).run(
    'cred-rahul-python-1',
    rahulTxHash,
    JSON.stringify({ sessionsTaught: 27, bayesianRating: 4.9, minSessionsRequired: 3, minRatingRequired: 4.5 })
  );

  db.prepare(`
    INSERT OR IGNORE INTO credentials (id, user_id, title, badge_type, skill_id, token_id, tx_hash, criteria_met)
    VALUES (?, 'usr-elena', 'Figma Mentor — Level 1', 'MENTOR_TIER_1', 'skill-figma', 'CERT-9102', ?, ?)
  `).run(
    'cred-elena-figma-1',
    '0x3d91c22e72e128b9d3b4a2e5d6c8109923847162901928374615243198765432',
    JSON.stringify({ sessionsTaught: 19, bayesianRating: 4.9, minSessionsRequired: 3, minRatingRequired: 4.5 })
  );

  // 4. Seed Sybil Suspicious Ring Data & Ratings
  // Botfarm 1 and Botfarm 2 give each other reciprocal 5 star reviews
  for (let i = 1; i <= 5; i++) {
    const sId1 = `sess-fake-${i}-a`;
    const sId2 = `sess-fake-${i}-b`;

    db.prepare(`
      INSERT OR IGNORE INTO sessions (
        id, title, skill_id, teacher_id, learner_id, status, scheduled_start, scheduled_end, credits_amount, learner_confirmed, teacher_confirmed, idempotency_key
      ) VALUES (?, 'Credit Swap Session', 'skill-python', 'usr-suspect-1', 'usr-suspect-2', 'COMPLETED', datetime('now', '-2 days'), datetime('now', '-2 days', '+1 hour'), 1, 1, 1, ?)
    `).run(sId1, `idem-${sId1}`);

    db.prepare(`
      INSERT OR IGNORE INTO ratings (id, session_id, rater_id, ratee_id, score, review, flagged_suspicious)
      VALUES (?, ?, 'usr-suspect-2', 'usr-suspect-1', 5.0, 'Instant 5 stars super fast exchange!', 0)
    `).run(`rat-${sId1}`, sId1);

    db.prepare(`
      INSERT OR IGNORE INTO sessions (
        id, title, skill_id, teacher_id, learner_id, status, scheduled_start, scheduled_end, credits_amount, learner_confirmed, teacher_confirmed, idempotency_key
      ) VALUES (?, 'Reciprocal Return Session', 'skill-react', 'usr-suspect-2', 'usr-suspect-1', 'COMPLETED', datetime('now', '-2 days'), datetime('now', '-2 days', '+1 hour'), 1, 1, 1, ?)
    `).run(sId2, `idem-${sId2}`);

    db.prepare(`
      INSERT OR IGNORE INTO ratings (id, session_id, rater_id, ratee_id, score, review, flagged_suspicious)
      VALUES (?, ?, 'usr-suspect-1', 'usr-suspect-2', 5.0, 'Great trade back 5 stars!', 0)
    `).run(`rat-${sId2}`, sId2);
  }

  // Record Fraud Alert for Moderator Queue
  db.prepare(`
    INSERT OR IGNORE INTO fraud_alerts (id, user_id, risk_score, risk_level, anomaly_reasons, status)
    VALUES (?, 'usr-suspect-1', 88.0, 'HIGH', ?, 'PENDING_REVIEW')
  `).run(
    'alert-suspect-1',
    JSON.stringify([
      'High reciprocal rating loop detected (100% mutual 5-star reviews with usr-suspect-2)',
      'Rapid credit velocity: 10 transactions in <24h',
      'Unverified campus identity status'
    ])
  );

  // 5. Seed StudySphere Campus Features: Study Groups, Resources, Flashcards
  db.prepare(`
    INSERT OR IGNORE INTO study_groups (id, name, description, subject, creator_id, meeting_schedule, max_members)
    VALUES 
    ('grp-1', 'Web3 & EVM Builders Circle', 'Weekly collaboration on Solidity smart contracts, hardhat testing, and dapp architecture.', 'Computer Science', 'usr-rahul', 'Thursdays 7:00 PM', 10),
    ('grp-2', 'Figma Design System Jam', 'Hands-on critique and design system token standardization sessions.', 'Design', 'usr-elena', 'Wednesdays 6:00 PM', 8),
    ('grp-3', 'Calculus III Study Collective', 'Exam problem sets, vector calculus proofs, and TA practice sessions.', 'Mathematics', 'usr-david', 'Mondays 5:00 PM', 12)
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO study_group_members (id, group_id, user_id, role)
    VALUES 
    ('sgm-1', 'grp-1', 'usr-rahul', 'ADMIN'),
    ('sgm-2', 'grp-1', 'usr-alice', 'MEMBER'),
    ('sgm-3', 'grp-2', 'usr-elena', 'ADMIN'),
    ('sgm-4', 'grp-3', 'usr-david', 'ADMIN')
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO study_resources (id, title, description, subject, author_id, resource_type, file_url, upvotes)
    VALUES 
    ('res-1', 'Smart Contract Security Audit Checklist', 'Comprehensive checklist covering reentrancy, integer overflow, flash loans, and access control.', 'Computer Science', 'usr-rahul', 'PDF', 'https://docs.skillswap.internal/evm-security.pdf', 34),
    ('res-2', 'React 18 & Server Components Cheat Sheet', 'Visual guide to hydration boundaries, async components, and Suspense patterns.', 'Computer Science', 'usr-alice', 'NOTES', 'https://docs.skillswap.internal/react-cheatsheet.pdf', 28),
    ('res-3', 'Design Systems Token Architecture', 'Figma typography, spacing matrix, and dark-mode color tokens guide.', 'Design', 'usr-elena', 'PDF', 'https://docs.skillswap.internal/design-tokens.pdf', 41)
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO flashcard_decks (id, user_id, title, subject, cards_count, is_public)
    VALUES 
    ('deck-1', 'usr-rahul', 'Solidity & EVM Opcodes Master Deck', 'Computer Science', 5, 1),
    ('deck-2', 'usr-alice', 'React Hooks & Rendering Lifecycle', 'Computer Science', 4, 1)
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO flashcards (id, deck_id, front, back, mastery_level)
    VALUES 
    ('fc-1', 'deck-1', 'What is the Checks-Effects-Interactions pattern in Solidity?', 'A security pattern where state checks occur first, internal state modifications second, and external contract calls last to prevent reentrancy attacks.', 4),
    ('fc-2', 'deck-1', 'What is the gas cost difference between storage and memory?', 'Storage writes are permanent and cost up to 20,000 gas (SSTORE), while memory is temporary and costs very little gas.', 3),
    ('fc-3', 'deck-1', 'Why should tx.origin never be used for authorization?', 'tx.origin returns the original EOA that initiated the call chain, making it vulnerable to phishing contract attacks. Always use msg.sender.', 5),
    ('fc-4', 'deck-2', 'When does useEffect run compared to useLayoutEffect?', 'useEffect runs asynchronously after paint. useLayoutEffect runs synchronously immediately after DOM mutations before browser paint.', 4),
    ('fc-5', 'deck-2', 'What is the purpose of React.memo?', 'Higher-order component that prevents re-rendering if props have not shallowly changed.', 3)
  `).run();

  console.log('SkillSwap Campus database seeding complete!');
}
