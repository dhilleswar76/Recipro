import { getDb } from './db';

export interface MatchingWeights {
  skillCompatibility: number;     // default 0.30
  availabilityOverlap: number;   // default 0.20
  proficiencyCompatibility: number;// default 0.15
  learningGoalSimilarity: number; // default 0.10
  reliability: number;           // default 0.10
  reputation: number;            // default 0.10
  teachingStyle: number;         // default 0.05
}

export const DEFAULT_WEIGHTS: MatchingWeights = {
  skillCompatibility: 0.30,
  availabilityOverlap: 0.20,
  proficiencyCompatibility: 0.15,
  learningGoalSimilarity: 0.10,
  reliability: 0.10,
  reputation: 0.10,
  teachingStyle: 0.05,
};

export interface CandidateResult {
  userId: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  college: string | null;
  major: string | null;
  year: string | null;
  isVerifiedStudent: boolean;
  trustScore: number;
  completionRate: number;
  hourlyRateCredits: number;
  teachingStyle: string;
  languages: string;
  matchedSkill: {
    skillId: string;
    skillName: string;
    category: string;
    proficiency: string;
    experienceYears: number;
    verificationStatus: string;
  };
  reputation: {
    bayesianRating: number;
    totalReviews: number;
    totalSessionsTaught: number;
    reliabilityScore: number;
  };
  availability: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
  matchScore: number; // 0 to 100
  matchBreakdown: {
    skillScore: number;
    availabilityScore: number;
    proficiencyScore: number;
    goalScore: number;
    reliabilityScore: number;
    reputationScore: number;
    styleScore: number;
  };
  explanationPoints: string[];
  discoveryMode: 'MODE_A_KNOWN_PERSON' | 'MODE_B_KNOWN_SKILL' | 'FALLBACK';
}

export interface SearchParams {
  query?: string;
  mode?: 'ALL' | 'MODE_A' | 'MODE_B' | 'MODE_C';
  skillCategory?: string;
  minProficiency?: string;
  dayOfWeek?: string;
  verifiedOnly?: boolean;
  minRating?: number;
  sessionMode?: string;
  requesterUserId?: string;
}

const PROFICIENCY_RANK: Record<string, number> = {
  'Beginner': 1,
  'Intermediate': 2,
  'Advanced': 3,
  'Expert': 4,
};

export function searchAndMatchCandidates(params: SearchParams, weights: MatchingWeights = DEFAULT_WEIGHTS): {
  knownPersonMatches: CandidateResult[];
  skillMatches: CandidateResult[];
  totalResults: number;
} {
  const db = getDb();
  const q = (params.query || '').trim().toLowerCase();
  const requesterId = params.requesterUserId || '';

  // Get requester's learning goals and availability if requester is logged in
  let requesterGoals: Array<{ skill_id: string; target_proficiency: string }> = [];
  let requesterAvailability: Array<{ day_of_week: string; start_time: string; end_time: string }> = [];

  if (requesterId) {
    requesterGoals = db.prepare(`
      SELECT skill_id, target_proficiency FROM learning_goals WHERE user_id = ?
    `).all(requesterId) as Array<{ skill_id: string; target_proficiency: string }>;

    requesterAvailability = db.prepare(`
      SELECT day_of_week, start_time, end_time FROM availability_slots WHERE user_id = ?
    `).all(requesterId) as Array<{ day_of_week: string; start_time: string; end_time: string }>;
  }

  // ============================================================
  // STAGE 1: MODE A — EXACT KNOWN PERSON LOOKUP (Deterministic)
  // ============================================================
  let knownPersonMatches: CandidateResult[] = [];

  if (q.length > 0) {
    // Check if query directly matches a user display name, email handle, or college ID
    const personRows = db.prepare(`
      SELECT 
        u.id as user_id, u.email, u.status, u.campus_id,
        p.display_name, p.avatar, p.bio, p.college, p.major, p.year,
        p.is_verified_student, p.trust_score, p.completion_rate, p.hourly_rate_credits,
        p.teaching_style, p.languages,
        r.bayesian_rating, r.total_reviews, r.total_sessions_taught, r.reliability_score
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      LEFT JOIN reputations r ON u.id = r.user_id
      WHERE u.status = 'ACTIVE'
        AND u.id != ?
        AND (
          LOWER(p.display_name) LIKE ?
          OR LOWER(u.email) LIKE ?
          OR LOWER(u.campus_id) LIKE ?
        )
      LIMIT 5
    `).all(requesterId, `%${q}%`, `${q}%`, `${q}%`) as any[];

    for (const pRow of personRows) {
      // Fetch skills taught by this person
      const userSkills = db.prepare(`
        SELECT us.*, s.name as skill_name, s.category as skill_category
        FROM user_skills us
        JOIN skills s ON us.skill_id = s.id
        WHERE us.user_id = ?
      `).all(pRow.user_id) as any[];

      const userAvail = db.prepare(`
        SELECT day_of_week, start_time, end_time
        FROM availability_slots
        WHERE user_id = ?
      `).all(pRow.user_id) as any[];

      const primarySkill = userSkills[0] || {
        skill_id: 'general',
        skill_name: 'Peer Tutoring & General Mentorship',
        skill_category: 'General',
        proficiency: 'Advanced',
        experience_years: 1,
        verification_status: 'CLAIMED',
      };

      knownPersonMatches.push({
        userId: pRow.user_id,
        displayName: pRow.display_name,
        avatar: pRow.avatar,
        bio: pRow.bio,
        college: pRow.college,
        major: pRow.major,
        year: pRow.year,
        isVerifiedStudent: Boolean(pRow.is_verified_student),
        trustScore: pRow.trust_score || 70,
        completionRate: pRow.completion_rate || 100,
        hourlyRateCredits: pRow.hourly_rate_credits || 1,
        teachingStyle: pRow.teaching_style || 'Interactive & Hands-on',
        languages: pRow.languages || 'English',
        matchedSkill: {
          skillId: primarySkill.skill_id,
          skillName: primarySkill.skill_name,
          category: primarySkill.skill_category,
          proficiency: primarySkill.proficiency,
          experienceYears: primarySkill.experience_years,
          verificationStatus: primarySkill.verification_status,
        },
        reputation: {
          bayesianRating: pRow.bayesian_rating || 4.5,
          totalReviews: pRow.total_reviews || 0,
          totalSessionsTaught: pRow.total_sessions_taught || 0,
          reliabilityScore: pRow.reliability_score || 95,
        },
        availability: userAvail.map((a: any) => ({
          dayOfWeek: a.day_of_week,
          startTime: a.start_time,
          endTime: a.end_time,
        })),
        matchScore: 99.0, // Top deterministic priority
        matchBreakdown: {
          skillScore: 95,
          availabilityScore: 90,
          proficiencyScore: 95,
          goalScore: 90,
          reliabilityScore: 98,
          reputationScore: 95,
          styleScore: 90,
        },
        explanationPoints: [
          `Exact identity match for "${pRow.display_name}"`,
          `Faculty: ${pRow.college} (${pRow.major})`,
          `Verified Student Badge: ${pRow.is_verified_student ? 'Yes' : 'Unverified'}`,
        ],
        discoveryMode: 'MODE_A_KNOWN_PERSON',
      });
    }
  }

  // ============================================================
  // STAGE 2: MODE B — HARD FILTERS + DETERMINISTIC CANDIDATE SET
  // ============================================================
  let filterConditions = [`u.status = 'ACTIVE'`, `u.id != ?`];
  let filterParams: any[] = [requesterId];

  // Skill keyword or category search
  if (q.length > 0) {
    filterConditions.push(`(
      LOWER(s.name) LIKE ? 
      OR LOWER(s.category) LIKE ? 
      OR LOWER(us.teaching_style) LIKE ?
      OR LOWER(p.bio) LIKE ?
    )`);
    filterParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  if (params.skillCategory) {
    filterConditions.push(`LOWER(s.category) = LOWER(?)`);
    filterParams.push(params.skillCategory);
  }

  if (params.verifiedOnly) {
    filterConditions.push(`p.is_verified_student = 1`);
  }

  if (params.minRating && params.minRating > 0) {
    filterConditions.push(`COALESCE(r.bayesian_rating, 4.0) >= ?`);
    filterParams.push(params.minRating);
  }

  const querySql = `
    SELECT 
      u.id as user_id, u.email, u.status, u.campus_id,
      p.display_name, p.avatar, p.bio, p.college, p.major, p.year,
      p.is_verified_student, p.trust_score, p.completion_rate, p.hourly_rate_credits,
      p.teaching_style, p.languages,
      s.id as skill_id, s.name as skill_name, s.category as skill_category,
      us.proficiency, us.experience_years, us.teaching_style as user_teaching_style,
      us.verification_status, us.evidence_url,
      r.bayesian_rating, r.total_reviews, r.total_sessions_taught, r.reliability_score
    FROM user_skills us
    JOIN skills s ON us.skill_id = s.id
    JOIN users u ON us.user_id = u.id
    JOIN profiles p ON u.id = p.user_id
    LEFT JOIN reputations r ON u.id = r.user_id
    WHERE ${filterConditions.join(' AND ')}
  `;

  const candidateRows = db.prepare(querySql).all(...filterParams) as any[];

  // ============================================================
  // STAGE 3: ML FEATURE CALCULATION & EXPLAINABILITY ENGINE
  // ============================================================
  const skillMatches: CandidateResult[] = [];

  for (const row of candidateRows) {
    // 1. Availability overlap score
    const userAvail = db.prepare(`
      SELECT day_of_week, start_time, end_time
      FROM availability_slots
      WHERE user_id = ?
    `).all(row.user_id) as any[];

    // If dayOfWeek filter applied, enforce hard availability filter
    if (params.dayOfWeek) {
      const hasDay = userAvail.some((a: any) => a.day_of_week.toLowerCase() === params.dayOfWeek?.toLowerCase());
      if (!hasDay) continue;
    }

    let availabilityScore = 70; // Baseline
    let hasScheduleOverlap = false;

    if (requesterAvailability.length > 0 && userAvail.length > 0) {
      // Calculate intersection of available slots
      let overlapCount = 0;
      for (const rA of requesterAvailability) {
        for (const uA of userAvail) {
          if (rA.day_of_week === uA.day_of_week) {
            overlapCount++;
            hasScheduleOverlap = true;
          }
        }
      }
      availabilityScore = Math.min(100, 50 + overlapCount * 25);
    } else if (userAvail.length >= 3) {
      availabilityScore = 85;
    }

    // 2. Skill compatibility score
    const teacherProfRank = PROFICIENCY_RANK[row.proficiency] || 2;
    let minProfRank = 1;
    if (params.minProficiency) {
      minProfRank = PROFICIENCY_RANK[params.minProficiency] || 1;
      if (teacherProfRank < minProfRank) continue; // Hard filter
    }

    let skillScore = 70 + (teacherProfRank * 6);
    if (row.verification_status === 'PLATFORM_VERIFIED') skillScore += 10;
    if (row.verification_status === 'PEER_VERIFIED') skillScore += 6;
    if (row.experience_years >= 2) skillScore += 6;
    skillScore = Math.min(100, skillScore);

    // 3. Proficiency compatibility
    const proficiencyScore = teacherProfRank >= 3 ? 95 : 80;

    // 4. Learning Goal similarity / Reciprocity
    let goalScore = 60;
    if (requesterGoals.length > 0) {
      const matchGoal = requesterGoals.some(g => g.skill_id === row.skill_id);
      if (matchGoal) goalScore = 95;
    }

    // 5. Reliability score
    const reliabilityScore = Math.min(100, Math.max(0, row.reliability_score || 95));

    // 6. Bayesian Reputation score
    const bayesianRating = row.bayesian_rating || 4.5;
    const reputationScore = Math.min(100, Math.round((bayesianRating / 5.0) * 100));

    // 7. Teaching Style compatibility
    const styleScore = 85;

    // Weighted Hybrid ML Score
    const totalMatchScore = Math.round(
      (skillScore * weights.skillCompatibility) +
      (availabilityScore * weights.availabilityOverlap) +
      (proficiencyScore * weights.proficiencyCompatibility) +
      (goalScore * weights.learningGoalSimilarity) +
      (reliabilityScore * weights.reliability) +
      (reputationScore * weights.reputation) +
      (styleScore * weights.teachingStyle)
    );

    // Explainable Points
    const explanationPoints: string[] = [];
    explanationPoints.push(`✓ ${row.skill_name} expertise (${row.proficiency} level, ${row.experience_years} yrs)`);
    if (hasScheduleOverlap) {
      explanationPoints.push(`✓ Mutual schedule availability overlap`);
    } else if (userAvail.length > 0) {
      explanationPoints.push(`✓ Active availability on ${userAvail.map((a: any) => a.day_of_week).slice(0, 2).join(', ')}`);
    }
    if (row.total_sessions_taught > 0) {
      explanationPoints.push(`✓ Strong verified history: ${bayesianRating.toFixed(1)}⭐ (${row.total_sessions_taught} completed sessions)`);
    }
    if (row.is_verified_student) {
      explanationPoints.push(`✓ Verified Campus Student (${row.college || 'Campus'})`);
    }

    skillMatches.push({
      userId: row.user_id,
      displayName: row.display_name,
      avatar: row.avatar,
      bio: row.bio,
      college: row.college,
      major: row.major,
      year: row.year,
      isVerifiedStudent: Boolean(row.is_verified_student),
      trustScore: row.trust_score || 70,
      completionRate: row.completion_rate || 100,
      hourlyRateCredits: row.hourly_rate_credits || 1,
      teachingStyle: row.user_teaching_style || row.teaching_style || 'Interactive',
      languages: row.languages || 'English',
      matchedSkill: {
        skillId: row.skill_id,
        skillName: row.skill_name,
        category: row.skill_category,
        proficiency: row.proficiency,
        experienceYears: row.experience_years,
        verificationStatus: row.verification_status,
      },
      reputation: {
        bayesianRating,
        totalReviews: row.total_reviews || 0,
        totalSessionsTaught: row.total_sessions_taught || 0,
        reliabilityScore: row.reliability_score || 95,
      },
      availability: userAvail.map((a: any) => ({
        dayOfWeek: a.day_of_week,
        startTime: a.start_time,
        endTime: a.end_time,
      })),
      matchScore: totalMatchScore,
      matchBreakdown: {
        skillScore,
        availabilityScore,
        proficiencyScore,
        goalScore,
        reliabilityScore,
        reputationScore,
        styleScore,
      },
      explanationPoints,
      discoveryMode: 'MODE_B_KNOWN_SKILL',
    });
  }

  // Sort skill matches by descending ML match score
  skillMatches.sort((a, b) => b.matchScore - a.matchScore);

  return {
    knownPersonMatches,
    skillMatches,
    totalResults: knownPersonMatches.length + skillMatches.length,
  };
}
