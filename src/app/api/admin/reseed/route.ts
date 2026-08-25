import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { withTransaction } from '@/lib/postgres';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authRes = await requireRole(req, ['ADMIN']);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  try {
    const passwordHash = await bcrypt.hash('Password123!', 10);

    await withTransaction(async (client) => {

    // Skills
    const skillsData = [
      { id: 'skill-python', name: 'Python Programming', category: 'Computer Science' },
      { id: 'skill-react', name: 'React & Next.js', category: 'Computer Science' },
      { id: 'skill-solidity', name: 'Solidity & Smart Contracts', category: 'Computer Science' },
      { id: 'skill-ml', name: 'Machine Learning & PyTorch', category: 'Computer Science' },
      { id: 'skill-dsa', name: 'Data Structures & Algorithms', category: 'Computer Science' },
      { id: 'skill-figma', name: 'UI/UX Design & Figma', category: 'Design' },
      { id: 'skill-spanish', name: 'Spanish Conversation', category: 'Languages' },
      { id: 'skill-calculus', name: 'Calculus & Linear Algebra', category: 'Mathematics' },
      { id: 'skill-finance', name: 'Corporate Finance & Valuation', category: 'Business' },
      { id: 'skill-node', name: 'Node.js & Express Backend', category: 'Computer Science' },
    ];

    for (const s of skillsData) {
      await client.query('INSERT INTO skills (id, name, category) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING', [s.id, s.name, s.category]);
    }

    const students = [
      { id: 'usr-keerthana', email: 'keerthana.rao@campus.edu', role: 'STUDENT', name: 'Keerthana Rao', college: 'Krishna Valley Engineering College', major: 'Computer Science', year: 'Junior', balance: 4, verified: 1, trust: 92 },
      { id: 'usr-saikiran', email: 'sai.kiran@campus.edu', role: 'STUDENT', name: 'Sai Kiran', college: 'Krishna Valley Engineering College', major: 'Computer Science & AI', year: 'Senior', balance: 6, verified: 1, trust: 96 },
      { id: 'usr-bhavya', email: 'bhavya.reddy@campus.edu', role: 'STUDENT', name: 'Bhavya Reddy', college: 'Coastal Andhra University', major: 'Digital Media & UI/UX', year: 'Senior', balance: 5, verified: 1, trust: 94 },
      { id: 'usr-vamsi', email: 'vamsi.krishna@campus.edu', role: 'STUDENT', name: 'Vamsi Krishna', college: 'Vijaya Engineering College', major: 'Applied Mathematics', year: 'Junior', balance: 3, verified: 1, trust: 90 },
      { id: 'usr-suspect-1', email: 'botfarm1@external-temp.net', role: 'STUDENT', name: 'QuickSwap Pro', college: 'Unknown Faculty', major: 'General Studies', year: 'Freshman', balance: 15, verified: 0, trust: 42 },
      { id: 'usr-mod-sirisha', email: 'moderator.sirisha@campus.edu', role: 'MODERATOR', name: 'Sirisha (Campus Moderator)', college: 'Andhra Institute of Technology', major: 'Student Affairs', year: 'Graduate', balance: 10, verified: 1, trust: 99 },
      { id: 'usr-admin', email: 'admin@skillswap.campus.edu', role: 'ADMIN', name: 'Srinivas Rao (Campus Admin)', college: 'IT & Infrastructure Services', major: 'System Administration', year: 'Staff', balance: 100, verified: 1, trust: 100 },
    ];

    for (const s of students) {
      await client.query(`INSERT INTO users (id, email, password_hash, role, status, campus_id) VALUES ($1, $2, $3, $4, 'ACTIVE', $5) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, status = EXCLUDED.status, campus_id = EXCLUDED.campus_id`, [s.id, s.email, passwordHash, s.role, `STU-${s.id.toUpperCase()}`]);
      await client.query(`INSERT INTO profiles (id, user_id, display_name, college, major, year, is_verified_student, trust_score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, display_name = EXCLUDED.display_name, college = EXCLUDED.college, major = EXCLUDED.major, year = EXCLUDED.year, is_verified_student = EXCLUDED.is_verified_student, trust_score = EXCLUDED.trust_score`, [`prof-${s.id}`, s.id, s.name, s.college, s.major, s.year, Boolean(s.verified), s.trust]);
      await client.query(`INSERT INTO skill_credit_accounts (id, user_id, balance, escrow_balance) VALUES ($1, $2, $3, 0) ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, balance = EXCLUDED.balance, escrow_balance = EXCLUDED.escrow_balance`, [`acc-${s.id}`, s.id, s.balance]);
      await client.query(`INSERT INTO reputations (id, user_id, total_reviews, total_sessions_taught, total_sessions_learned, bayesian_rating, reliability_score) VALUES ($1, $2, 0, 0, 0, 4.5, 95.0) ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, total_reviews = EXCLUDED.total_reviews, total_sessions_taught = EXCLUDED.total_sessions_taught, total_sessions_learned = EXCLUDED.total_sessions_learned, bayesian_rating = EXCLUDED.bayesian_rating, reliability_score = EXCLUDED.reliability_score`, [`rep-${s.id}`, s.id]);
    }

    const replace = async (table: string, columns: string[], values: unknown[]) => {
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const updates = columns.slice(1).map((column) => `${column} = EXCLUDED.${column}`).join(', ');
      await client.query(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updates}`, values);
    };

    // Teaching Skills
    for (const values of [
      ['usk-keerthana-react', 'usr-keerthana', 'skill-react', 'Advanced', 2.5, 'Hands-on project reviews', 'PLATFORM_VERIFIED'],
      ['usk-keerthana-node', 'usr-keerthana', 'skill-node', 'Intermediate', 1.5, 'API building workshops', 'PEER_VERIFIED'],
      ['usk-saikiran-python', 'usr-saikiran', 'skill-python', 'Expert', 3.5, 'Deep dive architecture & debugging', 'PLATFORM_VERIFIED'],
      ['usk-saikiran-solidity', 'usr-saikiran', 'skill-solidity', 'Advanced', 2.0, 'Smart contract security audits', 'PLATFORM_VERIFIED'],
      ['usk-bhavya-figma', 'usr-bhavya', 'skill-figma', 'Expert', 4.0, 'Figma component mastery & prototypes', 'PLATFORM_VERIFIED'],
      ['usk-vamsi-calculus', 'usr-vamsi', 'skill-calculus', 'Expert', 3.0, 'Step-by-step problem walkthroughs', 'PLATFORM_VERIFIED'],
    ]) await replace('user_skills', ['id', 'user_id', 'skill_id', 'proficiency', 'experience_years', 'teaching_style', 'verification_status'], values);

    // Learning Goals
    for (const values of [
      ['goal-keerthana-solidity', 'usr-keerthana', 'skill-solidity', 'Intermediate', 'HIGH', 'Want to build DeFi and credential contracts for senior project'],
      ['goal-saikiran-figma', 'usr-saikiran', 'skill-figma', 'Intermediate', 'HIGH', 'Need better UI/UX skills for my open-source projects'],
      ['goal-bhavya-python', 'usr-bhavya', 'skill-python', 'Intermediate', 'HIGH', 'Need Python data scripts for UX analytics'],
    ]) await replace('learning_goals', ['id', 'user_id', 'skill_id', 'target_proficiency', 'priority', 'notes'], values);

    // Availability
    for (const values of [
      ['avail-keerthana-tue', 'usr-keerthana', 'Tuesday', '18:00', '20:00'], ['avail-keerthana-thu', 'usr-keerthana', 'Thursday', '18:00', '20:00'],
      ['avail-saikiran-tue', 'usr-saikiran', 'Tuesday', '18:00', '21:00'], ['avail-saikiran-thu', 'usr-saikiran', 'Thursday', '18:00', '21:00'],
      ['avail-bhavya-tue', 'usr-bhavya', 'Tuesday', '18:00', '20:00'], ['avail-vamsi-mon', 'usr-vamsi', 'Monday', '16:00', '19:00'],
    ]) await replace('availability_slots', ['id', 'user_id', 'day_of_week', 'start_time', 'end_time'], values);

    // Reputations
    await client.query("UPDATE reputations SET total_reviews=24, total_sessions_taught=27, bayesian_rating=4.9, reliability_score=99 WHERE user_id='usr-saikiran'");
    await client.query("UPDATE reputations SET total_reviews=18, total_sessions_taught=19, bayesian_rating=4.9, reliability_score=97 WHERE user_id='usr-bhavya'");
    await client.query("UPDATE reputations SET total_reviews=7, total_sessions_taught=8, bayesian_rating=4.8, reliability_score=98 WHERE user_id='usr-keerthana'");
    await client.query("UPDATE skill_credit_accounts SET lifetime_earned=27, lifetime_spent=12 WHERE user_id='usr-saikiran'");

    // Verifiable Credential for Sai Kiran
    await replace('credentials', ['id', 'user_id', 'title', 'badge_type', 'skill_id', 'token_id', 'tx_hash', 'criteria_met'], [
      'cred-saikiran-python-1', 'usr-saikiran', 'Python Mentor — Level 1', 'MENTOR_TIER_1', 'skill-python', 'CERT-8841',
      '0x8f28c11e72e128b9d3b4a2e5d6c8109923847162901928374615243123456789',
      JSON.stringify({ sessionsTaught: 27, bayesianRating: 4.9, minSessionsRequired: 3, minRatingRequired: 4.5 })
    ]);

    // StudySphere Groups & Resources
    await replace('study_groups', ['id', 'name', 'description', 'subject', 'creator_id', 'meeting_schedule', 'max_members'], ['grp-1', 'Web3 & EVM Builders Circle', 'Weekly Solidity smart contract collaboration.', 'Computer Science', 'usr-saikiran', 'Thursdays 7:00 PM', 10]);
    await replace('study_groups', ['id', 'name', 'description', 'subject', 'creator_id', 'meeting_schedule', 'max_members'], ['grp-2', 'Figma Design System Jam', 'Critique and design system token standardization sessions.', 'Design', 'usr-bhavya', 'Wednesdays 6:00 PM', 8]);

    await replace('study_resources', ['id', 'title', 'description', 'subject', 'author_id', 'resource_type', 'file_url', 'upvotes'], ['res-1', 'Smart Contract Security Audit Checklist', 'Comprehensive checklist: reentrancy, integer overflow, access control.', 'Computer Science', 'usr-saikiran', 'PDF', 'https://docs.skillswap.internal/evm-security.pdf', 34]);
    await replace('study_resources', ['id', 'title', 'description', 'subject', 'author_id', 'resource_type', 'file_url', 'upvotes'], ['res-2', 'React 18 Server Components Cheat Sheet', 'Visual guide to hydration boundaries and Suspense patterns.', 'Computer Science', 'usr-keerthana', 'NOTES', 'https://docs.skillswap.internal/react-cheatsheet.pdf', 28]);

    await replace('flashcard_decks', ['id', 'user_id', 'title', 'subject', 'cards_count', 'is_public'], ['deck-1', 'usr-saikiran', 'Solidity & EVM Opcodes Master Deck', 'Computer Science', 3, true]);
    await replace('flashcards', ['id', 'deck_id', 'front', 'back', 'mastery_level'], ['fc-1', 'deck-1', 'What is the Checks-Effects-Interactions pattern?', 'A security pattern: state checks first, internal state modifications second, external calls last — prevents reentrancy.', 4]);
    await replace('flashcards', ['id', 'deck_id', 'front', 'back', 'mastery_level'], ['fc-2', 'deck-1', 'Gas cost: storage vs memory?', 'Storage SSTORE costs up to 20,000 gas (permanent). Memory is temporary and very cheap.', 3]);
    await replace('flashcards', ['id', 'deck_id', 'front', 'back', 'mastery_level'], ['fc-3', 'deck-1', 'Why never use tx.origin for authorization?', 'tx.origin returns the original EOA — vulnerable to phishing contracts. Always use msg.sender.', 5]);

    // Fraud Alert for Suspect-1
    await replace('fraud_alerts', ['id', 'user_id', 'risk_score', 'risk_level', 'anomaly_reasons', 'status'], [
      'alert-suspect-1', 'usr-suspect-1', 88.0, 'HIGH',
      JSON.stringify(['High reciprocal rating loop detected (100% mutual 5-star reviews)', 'Rapid credit velocity: 10 transactions in <24h', 'Unverified campus identity status']),
      'PENDING_REVIEW'
    ]);
    });

    return NextResponse.json({ success: true, message: 'Campus database successfully re-seeded with authentic Indian campus data!' });
  } catch (err: any) {
    console.error('Reseed API Error:', err);
    return NextResponse.json({ error: 'Failed to re-seed database: ' + err.message }, { status: 500 });
  }
}
