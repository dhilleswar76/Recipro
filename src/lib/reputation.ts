import { getDb } from './db';

/**
 * Confidence-Aware Bayesian Rating Calculator
 * Prior mean m = 4.5, Prior weight C = 3
 */
export function calculateBayesianRating(ratings: number[], priorMean: number = 4.5, priorWeight: number = 3): number {
  if (ratings.length === 0) return priorMean;
  const sum = ratings.reduce((acc, score) => acc + score, 0);
  const bayesian = (priorWeight * priorMean + sum) / (priorWeight + ratings.length);
  return Math.round(bayesian * 100) / 100;
}

/**
 * Recalculate and update reputation metrics for a specific user
 */
export function refreshUserReputation(userId: string): {
  bayesianRating: number;
  totalReviews: number;
  reliabilityScore: number;
  teachingScore: number;
  reciprocalRatio: number;
} {
  const db = getDb();

  // Fetch all ratings received by this user
  const ratings = db.prepare(`
    SELECT score, punctuality_score, clarity_score, flagged_suspicious
    FROM ratings
    WHERE ratee_id = ? AND flagged_suspicious = 0
  `).all(userId) as any[];

  const scores = ratings.map(r => r.score);
  const bayesianRating = calculateBayesianRating(scores);

  // Fetch session completion statistics
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_sessions,
      SUM(CASE WHEN status = 'CREDIT_SETTLED' OR status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_sessions,
      SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_sessions
    FROM sessions
    WHERE teacher_id = ? OR learner_id = ?
  `).get(userId, userId) as any;

  const totalSessions = stats.total_sessions || 0;
  const completed = stats.completed_sessions || 0;
  const cancelled = stats.cancelled_sessions || 0;

  const completionRate = totalSessions > 0 ? (completed / totalSessions) * 100 : 100;
  const cancellationRate = totalSessions > 0 ? (cancelled / totalSessions) * 100 : 0;

  // Average punctuality
  const avgPunctuality = ratings.length > 0
    ? ratings.reduce((acc, r) => acc + (r.punctuality_score || 5.0), 0) / ratings.length
    : 5.0;

  const reliabilityScore = Math.min(100, Math.max(0, Math.round(
    (completionRate * 0.7) + (avgPunctuality * 20 * 0.3)
  )));

  // Teaching score
  const teachingScore = Math.min(100, Math.round(
    (bayesianRating / 5.0) * 80 + (Math.min(10, completed) * 2)
  ));

  // Reciprocal ratio check
  const givenCount = (db.prepare(`SELECT COUNT(*) as c FROM ratings WHERE rater_id = ?`).get(userId) as any).c;
  const receivedCount = ratings.length;
  const reciprocalRatio = receivedCount > 0 ? Math.min(1.0, givenCount / receivedCount) : 0;

  // Update reputations table
  db.prepare(`
    INSERT INTO reputations (
      id, user_id, total_reviews, bayesian_rating, reliability_score, teaching_score, reciprocal_rating_ratio, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      total_reviews = excluded.total_reviews,
      bayesian_rating = excluded.bayesian_rating,
      reliability_score = excluded.reliability_score,
      teaching_score = excluded.teaching_score,
      reciprocal_rating_ratio = excluded.reciprocal_rating_ratio,
      updated_at = CURRENT_TIMESTAMP
  `).run(
    `rep-${userId}`,
    userId,
    receivedCount,
    bayesianRating,
    reliabilityScore,
    teachingScore,
    reciprocalRatio
  );

  // Sync profile trust metrics
  const overallTrust = Math.round((bayesianRating / 5.0) * 40 + reliabilityScore * 0.4 + 20);
  db.prepare(`
    UPDATE profiles
    SET trust_score = ?, completion_rate = ?, cancellation_rate = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(overallTrust, completionRate, cancellationRate, userId);

  return {
    bayesianRating,
    totalReviews: receivedCount,
    reliabilityScore,
    teachingScore,
    reciprocalRatio,
  };
}
