import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/postgres';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  // 1. Study Groups
  const studyGroupsResult = await query(`
    SELECT 
      sg.*,
      p.display_name as creator_name,
      (SELECT COUNT(*) FROM study_group_members WHERE group_id = sg.id) as member_count,
      (SELECT COUNT(*) FROM study_group_members WHERE group_id = sg.id AND user_id = $1) as is_member
    FROM study_groups sg
    JOIN profiles p ON sg.creator_id = p.user_id
    ORDER BY sg.created_at DESC
  `, [user.userId]);

  // 2. Study Resources
  const resourcesResult = await query(`
    SELECT 
      sr.*,
      p.display_name as author_name,
      p.college as author_college
    FROM study_resources sr
    JOIN profiles p ON sr.author_id = p.user_id
    ORDER BY sr.upvotes DESC, sr.created_at DESC
  `);

  // 3. Flashcard Decks
  const flashcardDecksResult = await query(`
    SELECT 
      fd.*,
      p.display_name as creator_name,
      (SELECT COUNT(*) FROM flashcards WHERE deck_id = fd.id) as total_cards
    FROM flashcard_decks fd
    JOIN profiles p ON fd.user_id = p.user_id
    ORDER BY fd.created_at DESC
  `);

  return NextResponse.json({
    studyGroups: studyGroupsResult.rows,
    resources: resourcesResult.rows,
    flashcardDecks: flashcardDecksResult.rows,
  });
}

export async function POST(req: NextRequest) {
  const authRes = await requireAuth(req);
  if ('errorResponse' in authRes) return authRes.errorResponse;

  const { user } = authRes;
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'JOIN_GROUP') {
      const { groupId } = body;
      await query(`
        INSERT INTO study_group_members (id, group_id, user_id, role)
        VALUES ($1, $2, $3, 'MEMBER')
        ON CONFLICT (group_id, user_id) DO NOTHING
      `, [`sgm-${Date.now()}`, groupId, user.userId]);

      return NextResponse.json({ success: true, message: 'Joined study circle successfully!' });
    }

    if (action === 'UPVOTE_RESOURCE') {
      const { resourceId } = body;
      await query(`UPDATE study_resources SET upvotes = upvotes + 1 WHERE id = $1`, [resourceId]);
      return NextResponse.json({ success: true, message: 'Resource upvoted!' });
    }

    if (action === 'CREATE_GROUP') {
      const { name, description, subject, meetingSchedule, maxMembers } = body;
      const groupId = `grp-${Date.now()}`;

      await withTransaction(async (client) => {
        await client.query(`
          INSERT INTO study_groups (id, name, description, subject, creator_id, meeting_schedule, max_members)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [groupId, name, description, subject, user.userId, meetingSchedule || 'Weekly', maxMembers || 10]);

        await client.query(`
          INSERT INTO study_group_members (id, group_id, user_id, role)
          VALUES ($1, $2, $3, 'ADMIN')
        `, [`sgm-${Date.now()}`, groupId, user.userId]);
      });
      return NextResponse.json({ success: true, message: 'Study circle created!', groupId }, { status: 201 });
    }

    if (action === 'GET_DECK_CARDS') {
      const { deckId } = body;
      const cardsResult = await query('SELECT * FROM flashcards WHERE deck_id = $1 ORDER BY id ASC', [deckId]);
      return NextResponse.json({ cards: cardsResult.rows });
    }

    if (action === 'UPDATE_CARD_MASTERY') {
      const { cardId, masteryLevel } = body;
      await query('UPDATE flashcards SET mastery_level = $1 WHERE id = $2', [masteryLevel, cardId]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('StudySphere Action Error:', err);
    return NextResponse.json({ error: 'Failed to process StudySphere action' }, { status: 500 });
  }
}
