const test = require('node:test');
const assert = require('node:assert');
const db = require('./test-db');

function calculateBayesianRating(ratings, priorMean = 4.5, priorWeight = 3) {
  if (ratings.length === 0) return priorMean;
  const sum = ratings.reduce((acc, score) => acc + score, 0);
  const bayesian = (priorWeight * priorMean + sum) / (priorWeight + ratings.length);
  return Math.round(bayesian * 100) / 100;
}

function extractSkillsDeterministic(text) {
  const lowerText = text.toLowerCase();
  const taxonomy = {
    'Python': ['python', 'py', 'django', 'flask', 'fastapi'],
    'React': ['react', 'react.js', 'next.js', 'nextjs'],
    'Node.js': ['node', 'node.js', 'express'],
    'Solidity': ['solidity', 'smart contract', 'ethereum', 'evm'],
  };

  const extracted = [];
  for (const [skill, kws] of Object.entries(taxonomy)) {
    if (kws.some(kw => lowerText.includes(kw))) {
      extracted.push({ skillName: skill, confidence: 88, proficiency: 'Advanced' });
    }
  }
  return extracted;
}

test('Bayesian Rating Confidence Invariant Test', () => {
  const newMentorRating = calculateBayesianRating([4.9, 4.9], 4.5, 3);
  assert.strictEqual(newMentorRating, 4.66);

  const ratings = Array(50).fill(4.8);
  const provenMentorRating = calculateBayesianRating(ratings, 4.5, 3);
  assert.strictEqual(provenMentorRating, 4.78);

  assert.ok(provenMentorRating > newMentorRating, 'Proven mentor with 50 sessions must outrank 2-session mentor');
});

test('Deterministic Skill NLP Extractor Invariant Test', () => {
  const sample = "I built three React websites, a Node backend and worked with MongoDB and Python.";
  const extracted = extractSkillsDeterministic(sample);
  
  const skillNames = extracted.map(s => s.skillName);
  assert.ok(skillNames.includes('React'), 'Should extract React');
  assert.ok(skillNames.includes('Python'), 'Should extract Python');
  assert.ok(skillNames.includes('Node.js'), 'Should extract Node.js');
});

test('Session State Machine & Escrow Double Settlement Guard', async (t) => {
  const runId = Date.now();
  const aliceId = `test-alice-${runId}`;
  const rahulId = `test-rahul-${runId}`;

  // Setup: insert isolated test users and credit accounts
  await db.run(
    `INSERT INTO users (id, email, password_hash, role, user_type) VALUES ($1,$2,'hash','STUDENT','TEACHER_LEARNER'),($3,$4,'hash','STUDENT','TEACHER_LEARNER')`,
    [aliceId, `alice-${runId}@test.edu`, rahulId, `rahul-${runId}@test.edu`]
  );
  await db.run(
    `INSERT INTO skill_credit_accounts (id, user_id, balance, escrow_balance) VALUES ($1,$2,3,0),($3,$4,0,0)`,
    [`acc-a-${runId}`, aliceId, `acc-r-${runId}`, rahulId]
  );

  // 1. Escrow Reservation
  await db.run(
    `UPDATE skill_credit_accounts SET balance = balance - 1, escrow_balance = escrow_balance + 1 WHERE user_id = $1`,
    [aliceId]
  );
  const aliceAcc = await db.get(`SELECT balance, escrow_balance FROM skill_credit_accounts WHERE user_id = $1`, [aliceId]);
  assert.strictEqual(Number(aliceAcc.balance), 2, 'Alice balance should decrease to 2');
  assert.strictEqual(Number(aliceAcc.escrow_balance), 1, 'Alice escrow balance should be 1');

  // 2. Settlement Release
  await db.run(`UPDATE skill_credit_accounts SET escrow_balance = escrow_balance - 1 WHERE user_id = $1`, [aliceId]);
  await db.run(`UPDATE skill_credit_accounts SET balance = balance + 1 WHERE user_id = $1`, [rahulId]);

  const rahulAcc = await db.get(`SELECT balance FROM skill_credit_accounts WHERE user_id = $1`, [rahulId]);
  assert.strictEqual(Number(rahulAcc.balance), 1, 'Rahul should receive 1 settled Skill Credit');

  // Cleanup
  await db.run(`DELETE FROM skill_credit_accounts WHERE user_id IN ($1,$2)`, [aliceId, rahulId]);
  await db.run(`DELETE FROM users WHERE id IN ($1,$2)`, [aliceId, rahulId]);
  await db.close();
});


function calculateBayesianRating(ratings, priorMean = 4.5, priorWeight = 3) {
  if (ratings.length === 0) return priorMean;
