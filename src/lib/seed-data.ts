import bcrypt from 'bcryptjs';
import { query } from './db';

export async function seedDatabase() {
  console.log('Seeding SkillSwap Campus database with authentic Indian / Telugu campus personas & Python demo scenarios...');

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

  for (const s of skillsData) {
    await query(`
      INSERT INTO skills (id, name, category, icon, description)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT(id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        icon = EXCLUDED.icon,
        description = EXCLUDED.description
    `, [s.id, s.name, s.category, s.icon, s.description]);
  }

  // 2. Synthetic Student Personas (Indian / Telugu Campus Personas)
  const students = [
    // PERSONA 1: STUDENT ONLY (Python Learner - Ananya Reddy)
    {
      id: 'usr-ananya',
      email: 'ananya.reddy@campus.edu',
      role: 'STUDENT',
      userType: 'LEARNER',
      displayName: 'Ananya Reddy',
      college: 'Godavari Institute of Computer Science',
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

    // PERSONA 2: MENTOR ONLY (Verified Python Mentor - Rahul Reddy)
    {
      id: 'usr-rahul',
      email: 'rahul.reddy@campus.edu',
      role: 'STUDENT',
      userType: 'TEACHER',
      displayName: 'Rahul Reddy',
      college: 'Andhra Institute of Technology',
      major: 'Computer Science & Software Systems',
      year: 'Senior',
      bio: 'Senior software engineering TA specializing in Python architecture, concurrency, FastAPIs, and clean backend practices.',
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

    // PERSONA 3: MENTOR + STUDENT (Verified Python Mentor & Web3 Learner - Sai Kiran)
    {
      id: 'usr-saikiran',
      email: 'sai.kiran@campus.edu',
      role: 'STUDENT',
      userType: 'TEACHER_LEARNER',
      displayName: 'Sai Kiran',
      college: 'Krishna Valley Engineering College',
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

    // PERSONA 4: MENTOR + STUDENT (Pending Verification Python Mentor - Sravani)
    {
      id: 'usr-sravani',
      email: 'sravani@campus.edu',
      role: 'STUDENT',
      userType: 'TEACHER_LEARNER',
      displayName: 'Sravani',
      college: 'Andhra Institute of Technology',
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

    // PERSONA 5: Web3 & Fullstack Specialist (Keerthana Rao)
    {
      id: 'usr-keerthana',
      email: 'keerthana.rao@campus.edu',
      role: 'STUDENT',
      userType: 'TEACHER_LEARNER',
      displayName: 'Keerthana Rao',
      college: 'Krishna Valley Engineering College',
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

    // PERSONA 6: Design & UI/UX Specialist (Bhavya Reddy)
    {
      id: 'usr-bhavya',
      email: 'bhavya.reddy@campus.edu',
      role: 'STUDENT',
      userType: 'TEACHER_LEARNER',
      displayName: 'Bhavya Reddy',
      college: 'Coastal Andhra University',
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

    // PERSONA 7: Mathematics & DSA Specialist (Vamsi Krishna)
    {
      id: 'usr-vamsi',
      email: 'vamsi.krishna@campus.edu',
      role: 'STUDENT',
      userType: 'TEACHER_LEARNER',
      displayName: 'Vamsi Krishna',
      college: 'Vijaya Engineering College',
      major: 'Applied Mathematics',
      year: 'Junior',
      bio: 'Math and algorithms mentor. I simplify complex calculus proofs, matrix algebra, and algorithmic foundations.',
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

    // PERSONA 8: Finance & Quantitative Learner (Pavan Kumar)
    {
      id: 'usr-pavan',
      email: 'pavan.kumar@campus.edu',
      role: 'STUDENT',
      userType: 'LEARNER',
      displayName: 'Pavan Kumar',
      college: 'Sri Vasavi Institute of Technology',
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

    // PERSONA 9: Campus Moderator (Sirisha)
    {
      id: 'usr-mod-sirisha',
      email: 'moderator.sirisha@campus.edu',
      role: 'MODERATOR',
      userType: 'TEACHER_LEARNER',
      displayName: 'Sirisha (Campus Moderator)',
      college: 'Andhra Institute of Technology',
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

    // PERSONA 10: Campus Admin (Srinivas Rao)
    {
      id: 'usr-admin',
      email: 'admin@skillswap.campus.edu',
      role: 'ADMIN',
      userType: 'TEACHER_LEARNER',
      displayName: 'Srinivas Rao (Campus Admin)',
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

  for (const stu of students) {
    await query(`
      INSERT INTO users (id, email, password_hash, role, status, campus_id, user_type, email_verified, is_academic_email)
      VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $6, true, true)
      ON CONFLICT(id) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        user_type = EXCLUDED.user_type,
        email_verified = true,
        is_academic_email = true
    `, [stu.id, stu.email, passwordHash, stu.role, `STU-${stu.id.replace('usr-', '').toUpperCase()}`, stu.userType || 'TEACHER_LEARNER']);

    await query(`
      INSERT INTO profiles (
        id, user_id, display_name, bio, college, major, year, is_verified_student, trust_score, teaching_preference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT(id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        bio = EXCLUDED.bio,
        college = EXCLUDED.college,
        major = EXCLUDED.major,
        year = EXCLUDED.year,
        is_verified_student = EXCLUDED.is_verified_student,
        trust_score = EXCLUDED.trust_score,
        teaching_preference = EXCLUDED.teaching_preference
    `, [
      `prof-${stu.id}`,
      stu.id,
      stu.displayName,
      stu.bio,
      stu.college,
      stu.major,
      stu.year,
      Boolean(stu.isVerified),
      stu.trustScore,
      stu.teachingPreference,
    ]);

    await query(`
      INSERT INTO skill_credit_accounts (id, user_id, balance, escrow_balance, lifetime_earned, lifetime_spent)
      VALUES ($1, $2, $3, 0, $4, $5)
      ON CONFLICT(user_id) DO UPDATE SET
        balance = EXCLUDED.balance,
        lifetime_earned = EXCLUDED.lifetime_earned,
        lifetime_spent = EXCLUDED.lifetime_spent
    `, [`acc-${stu.id}`, stu.id, stu.balance, stu.reputation.taught, stu.reputation.learned]);

    await query(`
      INSERT INTO reputations (
        id, user_id, total_reviews, total_sessions_taught, total_sessions_learned, bayesian_rating, reliability_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT(id) DO UPDATE SET
        total_reviews = EXCLUDED.total_reviews,
        total_sessions_taught = EXCLUDED.total_sessions_taught,
        total_sessions_learned = EXCLUDED.total_sessions_learned,
        bayesian_rating = EXCLUDED.bayesian_rating,
        reliability_score = EXCLUDED.reliability_score
    `, [
      `rep-${stu.id}`,
      stu.id,
      stu.reputation.reviews,
      stu.reputation.taught,
      stu.reputation.learned,
      stu.reputation.rating,
      stu.reputation.reliability,
    ]);

    // Teaching Skills
    for (const t of (stu.teaching as any[])) {
      await query(`
        INSERT INTO user_skills (
          id, user_id, skill_id, proficiency, experience_years, teaching_style, verification_status,
          assessment_score, teaching_days, available_start_time, available_end_time, preferred_start_time, preferred_end_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT(user_id, skill_id) DO UPDATE SET
          proficiency = EXCLUDED.proficiency,
          experience_years = EXCLUDED.experience_years,
          teaching_style = EXCLUDED.teaching_style,
          verification_status = EXCLUDED.verification_status,
          assessment_score = EXCLUDED.assessment_score,
          teaching_days = EXCLUDED.teaching_days,
          available_start_time = EXCLUDED.available_start_time,
          available_end_time = EXCLUDED.available_end_time,
          preferred_start_time = EXCLUDED.preferred_start_time,
          preferred_end_time = EXCLUDED.preferred_end_time
      `, [
        `usk-${stu.id}-${t.skillId}`,
        stu.id,
        t.skillId,
        t.proficiency,
        t.exp,
        t.style,
        t.status,
        t.score ?? null,
        t.teachingDays || '["Monday","Wednesday","Friday"]',
        t.availStart || '17:00',
        t.availEnd || '20:00',
        t.prefStart || '17:00',
        t.prefEnd || '20:00',
      ]);
    }

    // Learning Goals
    for (const g of stu.goals) {
      await query(`
        INSERT INTO learning_goals (id, user_id, skill_id, target_proficiency, priority, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT(user_id, skill_id) DO UPDATE SET
          target_proficiency = EXCLUDED.target_proficiency,
          priority = EXCLUDED.priority,
          notes = EXCLUDED.notes
      `, [
        `goal-${stu.id}-${g.skillId}`,
        stu.id,
        g.skillId,
        g.target,
        g.priority,
        g.notes,
      ]);
    }

    // Availability Slots
    for (const a of stu.availability) {
      await query(`
        INSERT INTO availability_slots (id, user_id, day_of_week, start_time, end_time)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT(id) DO UPDATE SET
          day_of_week = EXCLUDED.day_of_week,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time
      `, [
        `avail-${stu.id}-${a.day}`,
        stu.id,
        a.day,
        a.start,
        a.end,
      ]);
    }
  }

  // 3. Seed Realistic Python Learner Requests (Scenario: Ananya Reddy & Pavan Kumar seeking Python)
  await query(`
    INSERT INTO skill_requests (
      id, learner_id, skill_id, requested_proficiency, current_proficiency,
      learning_goal, preferred_schedule, preferred_session_mode, urgency, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT(id) DO UPDATE SET
      status = EXCLUDED.status,
      learning_goal = EXCLUDED.learning_goal
  `, [
    'req-ananya-python',
    'usr-ananya',
    'skill-python',
    'Intermediate',
    'Beginner',
    'Need 1-on-1 Python guidance for statistical modeling and pandas DataFrame manipulations.',
    'Tuesday or Thursday evenings (6 PM - 9 PM)',
    'ONLINE',
    'HIGH',
    'OPEN',
  ]);

  await query(`
    INSERT INTO skill_requests (
      id, learner_id, skill_id, requested_proficiency, current_proficiency,
      learning_goal, preferred_schedule, preferred_session_mode, urgency, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT(id) DO UPDATE SET
      status = EXCLUDED.status,
      learning_goal = EXCLUDED.learning_goal
  `, [
    'req-pavan-python',
    'usr-pavan',
    'skill-python',
    'Intermediate',
    'Beginner',
    'Looking for Python tutor for automated financial modeling & quantitative trading backtests.',
    'Friday evenings (5 PM - 8 PM)',
    'ONLINE',
    'MEDIUM',
    'OPEN',
  ]);

  // 4. Seed Verified Python Completed Session + Existing Blocking Session
  const nextMonday = new Date();
  const day = nextMonday.getDay();
  const diff = nextMonday.getDate() + (day === 0 ? 1 : (8 - day));
  nextMonday.setDate(diff);
  const sessionDateStr = nextMonday.toISOString().substring(0, 10);

  await query(`
    INSERT INTO sessions (
      id, title, skill_id, teacher_id, learner_id, status, scheduled_start, scheduled_end,
      duration_hours, credits_amount, mode, location_or_url, idempotency_key, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT(id) DO UPDATE SET
      status = EXCLUDED.status
  `, [
    'sess-rahul-blocked-1',
    'Python Async Architectures & FastAPIs',
    'skill-python',
    'usr-rahul',
    'usr-ananya',
    'SCHEDULED',
    `${sessionDateStr}T17:00:00Z`,
    `${sessionDateStr}T18:00:00Z`,
    1.0,
    1,
    'ONLINE',
    'https://meet.skillswap.internal/room-rahul-ananya',
    `idemp-rahul-session-${sessionDateStr}`,
    'Core Python backend architectures. Blocks 17:00-18:00 window.',
  ]);

  // 5. Seed Notifications
  await query(`
    INSERT INTO notifications (id, user_id, title, message, type, link)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT(id) DO UPDATE SET message = EXCLUDED.message
  `, [
    'notif-rahul-1',
    'usr-rahul',
    'Python Assessment Platform Verified',
    'Your Python skill assessment scored 95.0% and has been verified on-chain.',
    'CREDENTIAL_ISSUED',
    '/profile',
  ]);

  await query(`
    INSERT INTO notifications (id, user_id, title, message, type, link)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT(id) DO UPDATE SET message = EXCLUDED.message
  `, [
    'notif-ananya-1',
    'usr-ananya',
    'Python Learner Request Active',
    'Your request for Python Programming is broadcast to campus mentors.',
    'INFO',
    '/explore',
  ]);

  console.log('Seeding completed successfully with authentic Indian / Telugu campus demo data & role restrictions.');
}

