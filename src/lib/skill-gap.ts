import { query } from './postgres';

export interface SkillRequestItem {
  id: string;
  learnerId: string;
  learnerName: string;
  learnerCollege: string;
  skillId: string;
  skillName: string;
  category: string;
  requestedProficiency: string;
  currentProficiency: string;
  learningGoal: string;
  preferredSchedule: string | null;
  preferredSessionMode: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'MATCHED' | 'FULFILLED' | 'CANCELLED';
  createdAt: string;
}

export interface SkillDemandSummary {
  skillId: string;
  skillName: string;
  category: string;
  learnerDemandCount: number;
  verifiedTeacherCount: number;
  pendingTeacherCount: number;
  status: 'ZERO_SUPPLY' | 'LOW_SUPPLY' | 'BALANCED' | 'HEALTHY';
  relatedSkills: string[];
}

/**
 * Related Skills Taxonomy for Potential Mentor Discovery
 */
export const RELATED_SKILLS_MAP: Record<string, string[]> = {
  'quantum computing': ['Physics', 'Linear Algebra', 'Algorithms', 'Machine Learning', 'Python'],
  'solidity': ['JavaScript', 'TypeScript', 'Cryptography', 'Backend Development', 'Rust', 'Python'],
  'rust': ['C++', 'Systems Programming', 'Go', 'Data Structures', 'Operating Systems'],
  'machine learning': ['Python', 'Calculus', 'Linear Algebra', 'Statistics', 'Data Science'],
  'figma': ['UI/UX Design', 'Graphic Design', 'Web Design', 'Frontend Development'],
  'calculus': ['Linear Algebra', 'Physics', 'Discrete Mathematics', 'Differential Equations'],
  'cybersecurity': ['Computer Networks', 'Operating Systems', 'Linux', 'Cryptography', 'Python'],
  'neuroscience': ['Biology', 'Psychology', 'Cognitive Science', 'Machine Learning'],
};

/**
 * Get Demand Aggregation Statistics
 */
export async function getSkillDemandAnalytics(): Promise<SkillDemandSummary[]> {
  const skills = (await query('SELECT id, name, category FROM skills ORDER BY name ASC')).rows as Array<{
    id: string;
    name: string;
    category: string;
  }>;

  const results: SkillDemandSummary[] = [];

  for (const skill of skills) {
    // 1. Learner Demand Count from Open Skill Requests and Learning Goals
    const requestCount = Number((await query(`
      SELECT COUNT(*) as count FROM skill_requests WHERE skill_id = $1 AND status = 'OPEN'
    `, [skill.id])).rows[0]?.count) || 0;

    const goalCount = Number((await query(`
      SELECT COUNT(*) as count FROM learning_goals WHERE skill_id = $1
    `, [skill.id])).rows[0]?.count) || 0;

    const totalDemand = requestCount + goalCount;

    // 2. Verified Teachers
    const verifiedCount = Number((await query(`
      SELECT COUNT(DISTINCT us.user_id) as count 
      FROM user_skills us
      JOIN users u ON us.user_id = u.id
      WHERE us.skill_id = $1
        AND u.status = 'ACTIVE'
        AND us.verification_status IN ('PLATFORM_VERIFIED', 'ASSESSMENT_VERIFIED')
    `, [skill.id])).rows[0]?.count) || 0;

    // 3. Pending/Claimed Teachers
    const pendingCount = Number((await query(`
      SELECT COUNT(DISTINCT us.user_id) as count 
      FROM user_skills us
      JOIN users u ON us.user_id = u.id
      WHERE us.skill_id = $1
        AND u.status = 'ACTIVE'
        AND us.verification_status IN ('SELF_DECLARED', 'CLAIMED', 'AI_SUGGESTED')
    `, [skill.id])).rows[0]?.count) || 0;

    let status: SkillDemandSummary['status'] = 'HEALTHY';
    if (totalDemand > 0 && verifiedCount === 0) {
      status = 'ZERO_SUPPLY';
    } else if (totalDemand > verifiedCount * 3) {
      status = 'LOW_SUPPLY';
    } else if (totalDemand > 0) {
      status = 'BALANCED';
    }

    const normName = skill.name.toLowerCase();
    const related = RELATED_SKILLS_MAP[normName] || ['Computer Science', 'General Mentorship'];

    results.push({
      skillId: skill.id,
      skillName: skill.name,
      category: skill.category,
      learnerDemandCount: totalDemand,
      verifiedTeacherCount: verifiedCount,
      pendingTeacherCount: pendingCount,
      status,
      relatedSkills: related,
    });
  }

  // Sort by highest unfulfilled demand first (ZERO_SUPPLY first, then descending demand)
  results.sort((a, b) => {
    if (a.status === 'ZERO_SUPPLY' && b.status !== 'ZERO_SUPPLY') return -1;
    if (b.status === 'ZERO_SUPPLY' && a.status !== 'ZERO_SUPPLY') return 1;
    return b.learnerDemandCount - a.learnerDemandCount;
  });

  return results;
}

/**
 * Discover Potential Mentors with Related Skills for an unfulfilled skill
 */
export async function findPotentialMentorsForSkill(skillName: string): Promise<Array<{
  userId: string;
  displayName: string;
  email: string;
  college: string;
  relatedSkillName: string;
  proficiency: string;
  reputationRating: number;
}>> {
  const normName = skillName.toLowerCase();
  const relatedNames = RELATED_SKILLS_MAP[normName] || [];

  if (relatedNames.length === 0) return [];

  const placeholders = relatedNames.map((_, index) => `$${index + 1}`).join(',');
  const querySql = `
    SELECT DISTINCT
      u.id as user_id, u.email,
      p.display_name, p.college,
      s.name as related_skill_name,
      us.proficiency,
      COALESCE(r.bayesian_rating, 4.5) as reputation_rating
    FROM user_skills us
    JOIN skills s ON us.skill_id = s.id
    JOIN users u ON us.user_id = u.id
    JOIN profiles p ON u.id = p.user_id
    LEFT JOIN reputations r ON u.id = r.user_id
    WHERE u.status = 'ACTIVE'
      AND LOWER(s.name) IN (${placeholders})
      AND us.proficiency IN ('Advanced', 'Expert')
    LIMIT 10
  `;

  const rows = (await query(querySql, relatedNames.map(n => n.toLowerCase()))).rows as any[];

  return rows.map(r => ({
    userId: r.user_id,
    displayName: r.display_name,
    email: r.email,
    college: r.college || 'Campus',
    relatedSkillName: r.related_skill_name,
    proficiency: r.proficiency,
    reputationRating: r.reputation_rating,
  }));
}

/**
 * Create a new Skill Request when no verified mentor exists
 */
export async function createSkillRequest(data: {
  learnerId: string;
  skillName: string;
  category: string;
  requestedProficiency: string;
  currentProficiency: string;
  learningGoal: string;
  preferredSchedule?: string;
  preferredSessionMode?: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
}): Promise<{ success: boolean; requestId: string; message: string }> {

  // Find or create skill
  let skill = (await query('SELECT id, name FROM skills WHERE LOWER(name) = LOWER($1)', [data.skillName])).rows[0] as { id: string; name: string } | undefined;
  if (!skill) {
    const skillId = `skill-${data.skillName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    await query(`
      INSERT INTO skills (id, name, category, icon, description)
      VALUES ($1, $2, $3, 'BookOpen', 'Student requested skill')
    `, [skillId, data.skillName, data.category || 'Computer Science']);
    skill = { id: skillId, name: data.skillName };
  }

  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  await query(`
    INSERT INTO skill_requests (
      id, learner_id, skill_id, requested_proficiency, current_proficiency,
      learning_goal, preferred_schedule, preferred_session_mode, urgency, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'OPEN')
  `, [
    requestId,
    data.learnerId,
    skill.id,
    data.requestedProficiency || 'Beginner',
    data.currentProficiency || 'Beginner',
    data.learningGoal,
    data.preferredSchedule || null,
    data.preferredSessionMode || 'ONLINE',
    data.urgency || 'MEDIUM'
  ]);

  // Automatically subscribe learner for mentor availability notifications
  await query(`
    INSERT INTO skill_subscriptions (id, user_id, skill_id)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, skill_id) DO NOTHING
  `, [`sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, data.learnerId, skill.id]);

  return {
    success: true,
    requestId,
    message: `Skill Request for "${data.skillName}" created! You will be automatically notified as soon as a mentor becomes verified.`,
  };
}

/**
 * Notify Subscribed Learners when a New Verified Mentor Joins
 */
export async function notifyLearnersOfNewMentor(teacherId: string, skillId: string): Promise<number> {

  const skill = (await query('SELECT name FROM skills WHERE id = $1', [skillId])).rows[0] as { name: string } | undefined;
  const teacherProfile = (await query('SELECT display_name, college FROM profiles WHERE user_id = $1', [teacherId])).rows[0] as { display_name: string; college: string } | undefined;

  if (!skill || !teacherProfile) return 0;

  // Find all subscribers and open request owners
  const subscribers = (await query(`
    SELECT DISTINCT user_id FROM skill_subscriptions WHERE skill_id = $1 AND user_id != $2
    UNION
    SELECT DISTINCT learner_id as user_id FROM skill_requests WHERE skill_id = $3 AND status = 'OPEN' AND learner_id != $4
  `, [skillId, teacherId, skillId, teacherId])).rows as Array<{ user_id: string }>;

  let notifiedCount = 0;
  for (const sub of subscribers) {
    await query(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES ($1, $2, 'New Verified Mentor Available!', $3, 'INFO', '/explore')
    `, [
      `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sub.user_id,
      `Great news! ${teacherProfile.display_name} (${teacherProfile.college}) is now verified to teach "${skill.name}". Book your session now!`
    ]);
    notifiedCount++;
  }

  // Update open requests to MATCHED
  await query(`
    UPDATE skill_requests 
    SET status = 'MATCHED', matched_teacher_id = $1, updated_at = CURRENT_TIMESTAMP
    WHERE skill_id = $2 AND status = 'OPEN'
  `, [teacherId, skillId]);

  return notifiedCount;
}
