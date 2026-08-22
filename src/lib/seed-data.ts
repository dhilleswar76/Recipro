import bcrypt from 'bcryptjs';
import { getDb } from './db';
import Database from 'better-sqlite3';

export async function seedDatabase(customDb?: Database.Database) {
  const db = customDb || getDb();

  console.log('Seeding SkillSwap Campus database with verified campus personas & Python demo scenarios...');

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
    INSERT INTO skills (id, name, category, icon, description)
    VALUES (@id, @name, @category, @icon, @description)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      icon = excluded.icon,
      description = excluded.description
  `);

  for (const s of skillsData) {
    insertSkill.run(s);
  }

  // 2. Synthetic Student Personas (Role & Python Scenario Aware)
  const students = [
    // SCENARIO A: STUDENT ONLY (Python Learner)
    {
      id: 'usr-maya',
      email: 'maya.lin@campus.edu',
      role: 'STUDENT',
      userType: 'LEARNER',
      displayName: 'Maya Lin',
      college: 'School of Engineering',
      major: 'Data Science & Statistics',
      year: 'Sophomore',
      bio: 'Sophomore data science student eager to learn Python for pandas data analysis, automation scripts, and regression models.',
      isVerified: 1,
      trustScore: 88.0,
      balance: 4,
      teachingPreference: 'Anyone',
      teaching: [],
      goals: [
        { 
          skillId: 'skill-python', 
          target: 'Intermediate', 
          priority: 'HIGH', 
          notes: 'Need Python for data science coursework and statistical modeling' 
        },
      ],
      availability: [
        { day: 'Tuesday', start: '18:00', end: '21:00' },
        { day: 'Thursday', start: '18:00', end: '21:00' },
        { day: 'Saturday', start: '14:00', end: '18:00' },
      ],
      reputation: { taught: 0, learned: 6, rating: 4.8, reliability: 98, reviews: 5 },
    },

    // SCENARIO B: MENTOR ONLY (Verified Python Mentor)
    {
      id: 'usr-alex',
      email: 'alex.rivera@campus.edu',
      role: 'STUDENT',
      userType: 'TEACHER',
      displayName: 'Alex Rivera',
      college: 'School of Engineering',
      major: 'Computer Science & Software Systems',
      year: 'Senior',
      bio: 'Senior software engineering TA specializing in Python architecture, concurrency, FastAPIs, and clean code practices.',
      isVerified: 1,
      trustScore: 97.0,
      balance: 8,
      teachingPreference: 'Anyone',
      teaching: [
        { 
          skillId: 'skill-python', 
          proficiency: 'Expert', 
          exp: 3.5, 
          style: 'Hands-on architectural walkthroughs, debugging, and live coding', 
          status: 'PLATFORM_VERIFIED',
          score: 95.0,
          teachingDays: '["Monday","Wednesday","Friday"]',
          availStart: '17:00',
          availEnd: '20:00',
          prefStart: '17:00',
          prefEnd: '20:00'
        },
      ],
      goals: [],
      availability: [
        { day: 'Monday', start: '17:00', end: '20:00' },
        { day: 'Wednesday', start: '17:00', end: '20:00' },
        { day: 'Friday', start: '17:00', end: '20:00' },
      ],
      reputation: { taught: 32, learned: 0, rating: 4.95, reliability: 99, reviews: 29 },
    },

    // SCENARIO C1: MENTOR + STUDENT (Verified Python Mentor & Web3 Learner)
    {
      id: 'usr-rahul',
      email: 'rahul.kumar@campus.edu',
      role: 'STUDENT',
      userType: 'TEACHER_LEARNER',
      displayName: 'Rahul Kumar',
      college: 'School of Engineering',
      major: 'Computer Science & AI',
      year: 'Senior',
      bio: 'Senior developer specializing in Python data engineering, ML pipelines, and Solidity smart contracts.',
      isVerified: 1,
      trustScore: 96.0,
      balance: 6,
      teachingPreference: 'Anyone',
      teaching: [
        { 
          skillId: 'skill-python', 
          proficiency: 'Advanced', 
          exp: 3.0, 
          style: 'Deep dive into Python data pipelines, algorithms & clean backend architecture', 
          status: 'ASSESSMENT_VERIFIED',
          score: 92.0,
          teachingDays: '["Tuesday","Thursday","Sunday"]',
          availStart: '18:00',
          availEnd: '21:00',
          prefStart: '18:00',
          prefEnd: '21:00'
        },
        { 
          skillId: 'skill-solidity', 
          proficiency: 'Expert', 
          exp: 2.5, 
          style: 'Smart contract security audits and Hardhat test suites', 
          status: 'PLATFORM_VERIFIED',
          score: 98.0,
          teachingDays: '["Tuesday","Thursday"]',
          availStart: '18:00',
          availEnd: '21:00',
          prefStart: '18:00',
          prefEnd: '21:00'
        },
      ],
      goals: [
        { skillId: 'skill-figma', target: 'Intermediate', priority: 'HIGH', notes: 'Need better UI/UX skills for my open-source web projects' },
      ],
      availability: [
        { day: 'Tuesday', start: '18:00', end: '21:00' },
        { day: 'Thursday', start: '18:00', end: '21:00' },
        { day: 'Sunday', start: '11:00', end: '15:00' },
      ],
      reputation: { taught: 27, learned: 12, rating: 4.9, reliability: 99, reviews: 24 },
    },

    // SCENARIO C2: MENTOR + STUDENT (Pending Verification Python Mentor — For Verification Filter Testing)
    {
      id: 'usr-priya',
      email: 'priya.patel@campus.edu',
      role: 'STUDENT',
      userType: 'TEACHER_LEARNER',
      displayName: 'Priya Patel',
      college: 'School of Engineering',
      major: 'Information Technology',
      year: 'Junior',
      bio: 'Junior IT student. Self-taught in Python scripting and automating campus tasks. Ready to swap with React mentors.',
      isVerified: 1,
      trustScore: 82.0,
      balance: 3,
      teachingPreference: 'Anyone',
      teaching: [
        { 
          skillId: 'skill-python', 
          proficiency: 'Advanced', 
          exp: 2.0, 
          style: 'Practical beginner/intermediate Python automation scripts', 
          status: 'SELF_DECLARED',
          score: null,
          teachingDays: '["Monday","Wednesday","Friday"]',
          availStart: '18:00',
          availEnd: '21:00',
          prefStart: '18:00',
          prefEnd: '21:00'
        },
      ],
      goals: [
        { skillId: 'skill-react', target: 'Intermediate', priority: 'HIGH', notes: 'Looking to learn React components and state management' },
      ],
      availability: [
        { day: 'Monday', start: '18:00', end: '21:00' },
        { day: 'Wednesday', start: '18:00', end: '21:00' },
        { day: 'Friday', start: '18:00', end: '21:00' },
      ],
      reputation: { taught: 4, learned: 3, rating: 4.6, reliability: 92, reviews: 4 },
    },

    // Additional Student (Alice Chen - React Mentor & Solidity Learner)
    {
      id: 'usr-alice',
      email: 'alice@campus.edu',
      role: 'STUDENT',
      userType: 'TEACHER_LEARNER',
      displayName: 'Alice Chen',
      college: 'School of Engineering',
      major: 'Computer Science',
      year: 'Junior',
      bio: 'Junior CS student passionate about fullstack web apps and decentralized systems. Looking to master Solidity!',
      isVerified: 1,
      trustScore: 92.0,
      balance: 4,
      teachingPreference: 'Anyone',
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

    // Additional Design Specialist (Elena Rostova)
    {
      id: 'usr-elena',
      email: 'elena.rostova@campus.edu',
      role: 'STUDENT',
      userType: 'TEACHER_LEARNER',
      displayName: 'Elena Rostova',
      college: 'Faculty of Arts & Media',
      major: 'Digital Media & UI/UX',
      year: 'Senior',
      bio: 'Product designer focusing on accessible design systems and sleek web interfaces. Looking to learn Python for data visualization!',
      isVerified: 1,
      trustScore: 94.0,
      balance: 5,
      teachingPreference: 'Anyone',
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

    // Additional Math Specialist (David Kim)
    {
      id: 'usr-david',
      email: 'david.kim@campus.edu',
      role: 'STUDENT',
      userType: 'TEACHER_LEARNER',
      displayName: 'David Kim',
      college: 'Faculty of Mathematics',
      major: 'Applied Mathematics',
      year: 'Junior',
      bio: 'Math and stats tutor. I simplify complex calculus proofs, matrix algebra, and algorithmic foundations.',
      isVerified: 1,
      trustScore: 90.0,
      balance: 3,
      teachingPreference: 'Anyone',
      teaching: [
        { skillId: 'skill-calculus', proficiency: 'Expert', exp: 3.0, style: 'Step-by-step problem walkthroughs and intuitive proofs', status: 'PLATFORM_VERIFIED' },
        { skillId: 'skill-dsa', proficiency: 'Advanced', exp: 2.0, style: 'Algorithmic complexity & dynamic programming', status: 'ASSESSMENT_VERIFIED' },
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

    // Additional Student (Marcus Vance - Business / Python Learner)
    {
      id: 'usr-marcus',
      email: 'marcus.vance@campus.edu',
      role: 'STUDENT',
      userType: 'LEARNER',
      displayName: 'Marcus Vance',
      college: 'School of Business',
      major: 'Finance & Analytics',
      year: 'Senior',
      bio: 'Finance major preparing for quantitative roles. Looking for mentors in Python algorithmic trading scripts.',
      isVerified: 1,
      trustScore: 89.0,
      balance: 4,
      teachingPreference: 'Anyone',
      teaching: [
        { skillId: 'skill-finance', proficiency: 'Advanced', exp: 2.5, style: 'Real-world Excel financial modeling', status: 'PLATFORM_VERIFIED' },
      ],
      goals: [
        { skillId: 'skill-python', target: 'Intermediate', priority: 'HIGH', notes: 'Algorithmic trading scripts and financial data' },
      ],
      availability: [
        { day: 'Friday', start: '17:00', end: '20:00' },
        { day: 'Sunday', start: '14:00', end: '18:00' },
      ],
      reputation: { taught: 11, learned: 7, rating: 4.8, reliability: 94, reviews: 10 },
    },

    // SCENARIO D: MODERATOR & ADMIN PERSONAS
    {
      id: 'usr-mod-sarah',
      email: 'moderator.sarah@campus.edu',
      role: 'MODERATOR',
      userType: 'TEACHER_LEARNER',
      displayName: 'Sarah Jenkins (Campus Moderator)',
      college: 'Student Affairs & Honor Council',
      major: 'Campus Leadership',
      year: 'Graduate',
      bio: 'Official Campus Peer Learning Moderator. Reviewing dispute evidence, fraud signals, and credential standards.',
      isVerified: 1,
      trustScore: 99.0,
      balance: 10,
      teachingPreference: 'Anyone',
      teaching: [],
      goals: [],
      availability: [],
      reputation: { taught: 0, learned: 0, rating: 5.0, reliability: 100, reviews: 0 },
    },
    {
      id: 'usr-admin',
      email: 'admin@skillswap.campus.edu',
      role: 'ADMIN',
      userType: 'TEACHER_LEARNER',
      displayName: 'Campus Admin & SRE',
      college: 'IT & Infrastructure Services',
      major: 'System Administration',
      year: 'Staff',
      bio: 'Principal administrator overseeing platform security, smart contracts, emergency pause, and audit logs.',
      isVerified: 1,
      trustScore: 100.0,
      balance: 100,
      teachingPreference: 'Anyone',
      teaching: [],
      goals: [],
      availability: [],
      reputation: { taught: 0, learned: 0, rating: 5.0, reliability: 100, reviews: 0 },
    },
  ];

  // Insert Users, Profiles, Accounts, Reputations (Idempotent with ON CONFLICT)
  for (const stu of students) {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, status, campus_id, user_type)
      VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        password_hash = excluded.password_hash,
        role = excluded.role,
        user_type = excluded.user_type
    `).run(stu.id, stu.email, passwordHash, stu.role, `STU-${stu.id.replace('usr-', '').toUpperCase()}`, stu.userType || 'TEACHER_LEARNER');

    db.prepare(`
      INSERT INTO profiles (
        id, user_id, display_name, bio, college, major, year, is_verified_student, trust_score, teaching_preference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        display_name = excluded.display_name,
        bio = excluded.bio,
        college = excluded.college,
        major = excluded.major,
        year = excluded.year,
        is_verified_student = excluded.is_verified_student,
        trust_score = excluded.trust_score,
        teaching_preference = excluded.teaching_preference
    `).run(
      `prof-${stu.id}`,
      stu.id,
      stu.displayName,
      stu.bio,
      stu.college,
      stu.major,
      stu.year,
      stu.isVerified,
      stu.trustScore,
      stu.teachingPreference || 'Anyone'
    );

    db.prepare(`
      INSERT INTO skill_credit_accounts (id, user_id, balance, escrow_balance, lifetime_earned, lifetime_spent)
      VALUES (?, ?, ?, 0, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        balance = excluded.balance,
        lifetime_earned = excluded.lifetime_earned,
        lifetime_spent = excluded.lifetime_spent
    `).run(`acc-${stu.id}`, stu.id, stu.balance, stu.reputation.taught, stu.reputation.learned);

    db.prepare(`
      INSERT INTO reputations (
        id, user_id, total_reviews, total_sessions_taught, total_sessions_learned, bayesian_rating, reliability_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        total_reviews = excluded.total_reviews,
        total_sessions_taught = excluded.total_sessions_taught,
        total_sessions_learned = excluded.total_sessions_learned,
        bayesian_rating = excluded.bayesian_rating,
        reliability_score = excluded.reliability_score
    `).run(
      `rep-${stu.id}`,
      stu.id,
      stu.reputation.reviews,
      stu.reputation.taught,
      stu.reputation.learned,
      stu.reputation.rating,
      stu.reputation.reliability
    );

    // Insert/Update Teaching Skills
    for (const t of stu.teaching) {
      db.prepare(`
        INSERT INTO user_skills (
          id, user_id, skill_id, proficiency, experience_years, teaching_style, verification_status,
          assessment_score, teaching_days, available_start_time, available_end_time, preferred_start_time, preferred_end_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, skill_id) DO UPDATE SET
          proficiency = excluded.proficiency,
          experience_years = excluded.experience_years,
          teaching_style = excluded.teaching_style,
          verification_status = excluded.verification_status,
          assessment_score = excluded.assessment_score,
          teaching_days = excluded.teaching_days,
          available_start_time = excluded.available_start_time,
          available_end_time = excluded.available_end_time,
          preferred_start_time = excluded.preferred_start_time,
          preferred_end_time = excluded.preferred_end_time
      `).run(
        `usk-${stu.id}-${t.skillId}`,
        stu.id,
        t.skillId,
        t.proficiency,
        t.exp,
        t.style,
        t.status,
        (t as any).score || null,
        (t as any).teachingDays || '["Monday","Wednesday","Friday"]',
        (t as any).availStart || '17:00',
        (t as any).availEnd || '20:00',
        (t as any).prefStart || '17:00',
        (t as any).prefEnd || '20:00'
      );
    }

    // Insert/Update Goals
    for (const g of stu.goals) {
      db.prepare(`
        INSERT INTO learning_goals (id, user_id, skill_id, target_proficiency, priority, notes)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, skill_id) DO UPDATE SET
          target_proficiency = excluded.target_proficiency,
          priority = excluded.priority,
          notes = excluded.notes
      `).run(
        `goal-${stu.id}-${g.skillId}`,
        stu.id,
        g.skillId,
        g.target,
        g.priority,
        g.notes
      );
    }

    // Insert/Update Availability
    for (const a of stu.availability) {
      db.prepare(`
        INSERT INTO availability_slots (id, user_id, day_of_week, start_time, end_time)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          day_of_week = excluded.day_of_week,
          start_time = excluded.start_time,
          end_time = excluded.end_time
      `).run(
        `avail-${stu.id}-${a.day}`,
        stu.id,
        a.day,
        a.start,
        a.end
      );
    }
  }

  // 3. Seed Realistic Python Learner Requests (Scenario: Maya Lin & Marcus Vance seeking Python)
  db.prepare(`
    INSERT INTO skill_requests (
      id, learner_id, skill_id, requested_proficiency, current_proficiency,
      learning_goal, preferred_schedule, preferred_session_mode, urgency, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      learning_goal = excluded.learning_goal
  `).run(
    'req-maya-python',
    'usr-maya',
    'skill-python',
    'Intermediate',
    'Beginner',
    'Need 1-on-1 Python guidance for statistical modeling and pandas DataFrame manipulations.',
    'Tuesday or Thursday evenings (6 PM - 9 PM)',
    'ONLINE',
    'HIGH',
    'OPEN'
  );

  db.prepare(`
    INSERT INTO skill_requests (
      id, learner_id, skill_id, requested_proficiency, current_proficiency,
      learning_goal, preferred_schedule, preferred_session_mode, urgency, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      learning_goal = excluded.learning_goal
  `).run(
    'req-marcus-python',
    'usr-marcus',
    'skill-python',
    'Intermediate',
    'Beginner',
    'Looking for Python tutor for automated financial modeling & quantitative trading backtests.',
    'Friday evenings (5 PM - 8 PM)',
    'ONLINE',
    'MEDIUM',
    'OPEN'
  );

  // 4. Seed Verified Python Completed Session + Existing Blocking Session
  // Existing booked session on Monday for Alex Rivera (blocks 5 PM - 6 PM, leaving 6 PM - 8 PM open for Smart Slot Finder)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextMonday = new Date();
  const day = nextMonday.getDay();
  const diff = nextMonday.getDate() + (day === 0 ? 1 : (8 - day));
  nextMonday.setDate(diff);
  const sessionDateStr = nextMonday.toISOString().substring(0, 10);

  db.prepare(`
    INSERT INTO sessions (
      id, title, skill_id, teacher_id, learner_id, status, scheduled_start, scheduled_end,
      duration_hours, credits_amount, mode, location_or_url, idempotency_key, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status
  `).run(
    'sess-alex-blocked-1',
    'Python Async Architectures & FastAPIs',
    'skill-python',
    'usr-alex',
    'usr-maya',
    'SCHEDULED',
    `${sessionDateStr}T17:00:00Z`,
    `${sessionDateStr}T18:00:00Z`,
    1.0,
    1,
    'ONLINE',
    'https://meet.skillswap.internal/room-alex-maya',
    `idemp-alex-session-${sessionDateStr}`,
    'Core Python backend architectures. Blocks 17:00-18:00 window.'
  );

  // 5. Seed Notifications
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, link)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET message = excluded.message
  `).run(
    'notif-alex-1',
    'usr-alex',
    'Python Assessment Platform Verified',
    'Your Python skill assessment scored 95.0% and has been verified on-chain.',
    'CREDENTIAL_ISSUED',
    '/profile'
  );

  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, link)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET message = excluded.message
  `).run(
    'notif-maya-1',
    'usr-maya',
    'Python Learner Request Active',
    'Your request for Python Programming is broadcast to campus mentors.',
    'INFO',
    '/explore'
  );

  console.log('Seeding completed successfully with real Python demo data & role restrictions.');
}
