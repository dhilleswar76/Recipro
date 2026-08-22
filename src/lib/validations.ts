import { z } from 'zod';

// ==========================================
// AUTHENTICATION SCHEMAS
// ==========================================

export const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  college: z.string().min(2, 'College name is required').max(100),
  major: z.string().min(2, 'Major/Faculty is required').max(100),
  year: z.enum(['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'PhD']),
  role: z.enum(['STUDENT', 'MODERATOR', 'ADMIN']).optional().default('STUDENT'),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

// ==========================================
// PROFILE & SKILLS SCHEMAS
// ==========================================

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  college: z.string().max(100).optional(),
  major: z.string().max(100).optional(),
  year: z.string().optional(),
  teachingStyle: z.string().max(200).optional(),
  languages: z.string().max(200).optional(),
  profileVisibility: z.enum(['PUBLIC', 'CAMPUS_ONLY', 'PRIVATE']).optional(),
  mlConsent: z.boolean().optional(),
});

export const AddSkillSchema = z.object({
  skillName: z.string().min(2).max(50).trim(),
  category: z.string().min(2).max(50),
  proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  experienceYears: z.number().min(0).max(20).default(1),
  teachingStyle: z.string().max(200).optional().default('Hands-on practice & examples'),
  evidenceUrl: z.string().url().or(z.literal('')).optional(),
  verificationStatus: z.enum(['CLAIMED', 'AI_SUGGESTED', 'PEER_VERIFIED', 'PLATFORM_VERIFIED']).optional().default('CLAIMED'),
});

export const AddGoalSchema = z.object({
  skillName: z.string().min(2).max(50).trim(),
  category: z.string().min(2).max(50),
  targetProficiency: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).default('Intermediate'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  notes: z.string().max(300).optional(),
});

export const SetAvailabilitySchema = z.object({
  slots: z.array(z.object({
    dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM'),
  })),
});

// ==========================================
// SEARCH & DISCOVERY SCHEMAS
// ==========================================

export const SearchQuerySchema = z.object({
  q: z.string().optional().default(''), // Keyword (Person name OR Skill name)
  mode: z.enum(['ALL', 'MODE_A', 'MODE_B', 'MODE_C']).optional().default('ALL'),
  skillCategory: z.string().optional(),
  minProficiency: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),
  dayOfWeek: z.string().optional(),
  verifiedOnly: z.enum(['true', 'false']).optional(),
  minRating: z.string().optional(),
  sessionMode: z.enum(['ONLINE', 'CAMPUS_IN_PERSON', 'ALL']).optional().default('ALL'),
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('20'),
});

// ==========================================
// SESSION & CREDIT SCHEMAS
// ==========================================

export const BookSessionSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required'),
  skillId: z.string().min(1, 'Skill ID is required'),
  title: z.string().min(3).max(100),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  durationHours: z.number().min(0.5).max(8).default(1.0),
  creditsAmount: z.number().int().min(1).max(10).default(1),
  mode: z.enum(['ONLINE', 'CAMPUS_IN_PERSON']).default('ONLINE'),
  notes: z.string().max(500).optional(),
});

export const SessionActionSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT', 'START', 'CONFIRM_COMPLETION', 'CANCEL', 'DISPUTE']),
  reason: z.string().max(500).optional(),
  idempotencyKey: z.string().min(10),
});

// ==========================================
// RATINGS & REVIEWS SCHEMAS
// ==========================================

export const SubmitRatingSchema = z.object({
  sessionId: z.string().min(1),
  score: z.number().min(1).max(5),
  review: z.string().min(5).max(1000),
  punctualityScore: z.number().min(1).max(5).default(5),
  clarityScore: z.number().min(1).max(5).default(5),
  skillsDemonstrated: z.string().optional(),
});

// ==========================================
// WALLET & WEB3 SCHEMAS
// ==========================================

export const LinkWalletSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address'),
  chainId: z.number().int().default(31337),
  signature: z.string().min(10, 'Cryptographic signature is required'),
  nonce: z.string().min(8, 'Nonce challenge is required'),
});

// ==========================================
// AI & EXTRACTION SCHEMAS
// ==========================================

export const AnalyzeSkillsInputSchema = z.object({
  freeText: z.string().min(10, 'Please provide at least 10 characters of experience text').max(5000),
});

// ==========================================
// REPORTS & MODERATION SCHEMAS
// ==========================================

export const CreateReportSchema = z.object({
  reportedId: z.string().min(1),
  sessionId: z.string().optional(),
  reason: z.enum(['NO_SHOW', 'HARASSMENT', 'WRONG_SKILL', 'CREDIT_FRAUD', 'OTHER']),
  details: z.string().min(10).max(2000),
});

export const CreateDisputeSchema = z.object({
  sessionId: z.string().min(1),
  reason: z.string().min(10).max(2000),
  evidenceUrl: z.string().url().or(z.literal('')).optional(),
});

export const ModeratorActionSchema = z.object({
  targetType: z.enum(['USER', 'REPORT', 'DISPUTE', 'FRAUD_ALERT', 'SESSION']),
  targetId: z.string().min(1),
  action: z.enum(['RESOLVE_REFUND', 'RESOLVE_PAYOUT', 'SUSPEND_USER', 'RESTRICT_CREDITS', 'DISMISS_REPORT', 'CLEAR_ALERT', 'FORCE_CANCEL']),
  reason: z.string().min(5).max(500),
});
