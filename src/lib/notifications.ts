import { EmailService } from './email-service';
import { query, withTransaction } from './postgres';

export type NotificationType =
  | 'SESSION_REQUESTED'
  | 'SESSION_ACCEPTED'
  | 'SESSION_REJECTED'
  | 'SESSION_CANCELLED'
  | 'SESSION_REMINDER'
  | 'SESSION_STARTED'
  | 'SESSION_COMPLETION_PENDING'
  | 'SESSION_COMPLETED'
  | 'SESSION_DISPUTED'
  | 'CREDIT_RESERVED'
  | 'CREDIT_SETTLED'
  | 'CREDIT_REFUNDED'
  | 'MENTOR_AVAILABLE'
  | 'LEARNER_REQUEST_CREATED'
  | 'LEARNER_REQUEST_UPDATED'
  | 'SKILL_VERIFIED'
  | 'SKILL_ASSESSMENT_FAILED'
  | 'CREDENTIAL_ISSUED'
  | 'SECURITY_ALERT'
  | 'SYSTEM_NOTIFICATION';

export type NotificationCategory =
  | 'ALL'
  | 'SESSIONS'
  | 'MENTORS'
  | 'LEARNING_REQUESTS'
  | 'CREDITS'
  | 'SECURITY'
  | 'SYSTEM';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: 'SESSION' | 'MENTOR' | 'LEARNER_REQUEST' | 'CREDIT' | 'SECURITY' | 'SYSTEM';
  relatedEntityId?: string;
  actionUrl?: string;
  link?: string;
  mentorName?: string;
  skillName?: string;
  mentorVerification?: string;
  availabilityWindow?: string;
  matchScore?: number;
  requestId?: string;
}

export class NotificationService {
  /**
   * Helper to map notification type to category
   */
  static getCategoryForType(type: string): NotificationCategory {
    if (type.startsWith('SESSION_')) return 'SESSIONS';
    if (type === 'MENTOR_AVAILABLE') return 'MENTORS';
    if (type.startsWith('LEARNER_REQUEST_')) return 'LEARNING_REQUESTS';
    if (type.startsWith('CREDIT_')) return 'CREDITS';
    if (type.startsWith('SECURITY_')) return 'SECURITY';
    return 'SYSTEM';
  }

  /**
   * Dispatches notifications across In-App, Email, and Push with full user preferences & delivery tracking
   */
  static async send(payload: NotificationPayload): Promise<{
    inAppSuccess: boolean;
    emailSuccess: boolean;
    notificationId: string;
  }> {
    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const category = this.getCategoryForType(payload.type);
    let inAppSuccess = false;
    let emailSuccess = false;

    const { prefs, userProfile } = await withTransaction(async (client) => {
      const preferencesResult = await client.query(
        'SELECT * FROM notification_preferences WHERE user_id = $1',
        [payload.userId],
      );
      let prefs = preferencesResult.rows[0] as any;

      if (!prefs) {
        await client.query(`
          INSERT INTO notification_preferences (user_id, in_app_enabled, email_enabled, session_updates, mentor_available, credits, security, system)
          VALUES ($1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE)
          ON CONFLICT (user_id) DO NOTHING
        `, [payload.userId]);
        prefs = {
          in_app_enabled: true,
          email_enabled: true,
          session_updates: true,
          mentor_available: true,
          credits: true,
          security: true,
          system: true,
        };
      }

      const profileResult = await client.query<{ email: string; display_name: string }>(`
        SELECT u.email, p.display_name
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = $1
      `, [payload.userId]);

      const categoryEnabled =
        category === 'SECURITY' ? true :
        category === 'SESSIONS' ? prefs.session_updates :
        category === 'MENTORS' ? prefs.mentor_available :
        category === 'LEARNING_REQUESTS' ? prefs.mentor_available :
        category === 'CREDITS' ? prefs.credits :
        prefs.system;

      if (prefs.in_app_enabled && categoryEnabled) {
        try {
          await client.query(`
            INSERT INTO notifications (
              id, user_id, type, title, message, related_entity_type, related_entity_id, action_url, link, is_read, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, CURRENT_TIMESTAMP)
          `, [
            notificationId,
            payload.userId,
            payload.type,
            payload.title,
            payload.message,
            payload.relatedEntityType || category,
            payload.relatedEntityId || payload.requestId || null,
            payload.actionUrl || payload.link || '/notifications',
            payload.link || payload.actionUrl || '/notifications',
          ]);
          inAppSuccess = true;
        } catch (err) {
          console.error('In-App Notification Error:', err);
        }
      }

      return { prefs, userProfile: profileResult.rows[0] };
    });

    // Check if category is enabled for email
    const categoryEnabled =
      category === 'SECURITY' ? true : // Security notifications always ON
      category === 'SESSIONS' ? prefs.session_updates :
      category === 'MENTORS' ? prefs.mentor_available :
      category === 'LEARNING_REQUESTS' ? prefs.mentor_available :
      category === 'CREDITS' ? prefs.credits :
      prefs.system;

    // 2. EMAIL DISPATCH
    if (prefs.email_enabled && categoryEnabled && userProfile?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      if (payload.type === 'MENTOR_AVAILABLE' && payload.requestId) {
        // Mentor Available Email with Yes/No Confirmation Action
        const confirmUrl = `${appUrl}/learner-requests/${payload.requestId}/confirm-match?mentorId=${payload.relatedEntityId || ''}`;
        const declineUrl = `${appUrl}/learner-requests/${payload.requestId}/decline-match?mentorId=${payload.relatedEntityId || ''}`;

        const emailRes = await EmailService.sendMentorAvailableEmail({
          to: userProfile.email,
          learnerName: userProfile.display_name || 'Learner',
          skillName: payload.skillName || 'Requested Skill',
          mentorName: payload.mentorName || 'Campus Peer Mentor',
          mentorVerification: payload.mentorVerification || 'Verified Mentor',
          availabilityWindow: payload.availabilityWindow || 'Preferred schedule',
          matchScore: payload.matchScore,
          confirmUrl,
          declineUrl,
          requestId: payload.requestId,
          mentorId: payload.relatedEntityId || '',
          userId: payload.userId,
          notificationId,
        });
        emailSuccess = emailRes.success;
      } else {
        // General Notification Email
        const emailRes = await EmailService.sendEmail({
          to: userProfile.email,
          subject: payload.title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h3 style="color: #0f172a;">${payload.title}</h3>
              <p style="color: #334155; font-size: 14px;">${payload.message}</p>
              <div style="margin: 20px 0;">
                <a href="${appUrl}${payload.actionUrl || '/notifications'}" style="background-color: #14b8a6; color: #020617; font-weight: bold; text-decoration: none; padding: 10px 20px; border-radius: 6px; display: inline-block;">
                  View on SkillSwap Campus
                </a>
              </div>
            </div>
          `,
          text: payload.message,
          category: payload.type,
          metadata: {
            userId: payload.userId,
            notificationId,
            requestId: payload.requestId,
          },
        });
        emailSuccess = emailRes.success;
      }
    }

    return { inAppSuccess, emailSuccess, notificationId };
  }

  /**
   * Retrieves paginated user notifications with category filtering
   */
  static async getUserNotifications(
    userId: string,
    params: {
      category?: string;
      unreadOnly?: boolean;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 15));
    const offset = (page - 1) * limit;

    let whereClauses = ['user_id = $1'];
    let queryParams: any[] = [userId];

    if (params.unreadOnly) {
      whereClauses.push('is_read = FALSE');
    }

    if (params.category && params.category !== 'ALL') {
      const cat = params.category;
      if (cat === 'SESSIONS') {
        whereClauses.push("type LIKE 'SESSION_%'");
      } else if (cat === 'MENTORS') {
        whereClauses.push("type = 'MENTOR_AVAILABLE'");
      } else if (cat === 'LEARNING_REQUESTS') {
        whereClauses.push("type LIKE 'LEARNER_REQUEST_%'");
      } else if (cat === 'CREDITS') {
        whereClauses.push("type LIKE 'CREDIT_%'");
      } else if (cat === 'SECURITY') {
        whereClauses.push("type LIKE 'SECURITY_%'");
      } else if (cat === 'SYSTEM') {
        whereClauses.push("(type LIKE 'SYSTEM_%' OR type = 'INFO' OR type = 'GENERAL')");
      }
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const totalResult = await query(`
      SELECT COUNT(*) as count FROM notifications ${whereSql}
    `, queryParams);
    const totalCount = Number((totalResult.rows[0] as any).count);

    const unreadResult = await query(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE
    `, [userId]);
    const unreadCount = Number((unreadResult.rows[0] as any).count);

    const notificationsResult = await query(`
      SELECT * FROM notifications
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `, [...queryParams, limit, offset]);

    return {
      notifications: notificationsResult.rows,
      unreadCount,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Retrieves quick unread count for navbar badges
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const result = await query(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE
    `, [userId]);
    return Number((result.rows[0] as any)?.count || 0);
  }

  /**
   * Marks a single notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const res = await query(`
      UPDATE notifications 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND user_id = $2
    `, [notificationId, userId]);
    return (res.rowCount || 0) > 0;
  }

  /**
   * Marks all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    const res = await query(`
      UPDATE notifications 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1 AND is_read = FALSE
    `, [userId]);
    return res.rowCount || 0;
  }

  /**
   * Get user notification preferences
   */
  static async getUserPreferences(userId: string) {
    const existingResult = await query(`SELECT * FROM notification_preferences WHERE user_id = $1`, [userId]);
    let prefs = existingResult.rows[0];
    if (!prefs) {
      await query(`
        INSERT INTO notification_preferences (user_id, in_app_enabled, email_enabled, session_updates, mentor_available, credits, security, system)
        VALUES ($1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE)
        ON CONFLICT (user_id) DO NOTHING
      `, [userId]);
      prefs = {
        user_id: userId,
        in_app_enabled: true,
        email_enabled: true,
        session_updates: true,
        mentor_available: true,
        credits: true,
        security: true,
        system: true,
      };
    }
    return prefs;
  }

  /**
   * Update user notification preferences
   */
  static async updateUserPreferences(
    userId: string,
    prefs: {
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
      sessionUpdates?: boolean;
      mentorAvailable?: boolean;
      credits?: boolean;
      system?: boolean;
    }
  ) {
    await query(`
      INSERT INTO notification_preferences (
        user_id, in_app_enabled, email_enabled, session_updates, mentor_available, credits, security, system, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        in_app_enabled = COALESCE(excluded.in_app_enabled, notification_preferences.in_app_enabled),
        email_enabled = COALESCE(excluded.email_enabled, notification_preferences.email_enabled),
        session_updates = COALESCE(excluded.session_updates, notification_preferences.session_updates),
        mentor_available = COALESCE(excluded.mentor_available, notification_preferences.mentor_available),
        credits = COALESCE(excluded.credits, notification_preferences.credits),
        system = COALESCE(excluded.system, notification_preferences.system),
        updated_at = CURRENT_TIMESTAMP
    `, [
      userId,
      prefs.inAppEnabled !== undefined ? Boolean(prefs.inAppEnabled) : true,
      prefs.emailEnabled !== undefined ? Boolean(prefs.emailEnabled) : true,
      prefs.sessionUpdates !== undefined ? Boolean(prefs.sessionUpdates) : true,
      prefs.mentorAvailable !== undefined ? Boolean(prefs.mentorAvailable) : true,
      prefs.credits !== undefined ? Boolean(prefs.credits) : true,
      prefs.system !== undefined ? Boolean(prefs.system) : true,
    ]);

    return this.getUserPreferences(userId);
  }
}
