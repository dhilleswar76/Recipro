# SKILLSWAP CAMPUS

> **"Students exchange skills instead of money."**

SkillSwap Campus is a production-grade campus peer-learning platform and decentralized skill barter economy. Students teach topics they have mastered to earn zero-fee **Skill Credits**, then spend those credits learning subjects they need from other students.

---

## 🌟 Key Highlights & Subsystems

1. **Smart Slot Finder & Preferred Time Scheduling**:
   - IRCTC-style slot scanning with **15-minute buffer enforcement** between consecutive sessions.
   - Stage 1 (Inside-College) $\rightarrow$ Stage 2 (Outside-College Fallback) $\rightarrow$ Stage 3 (Learner Request System).
   - Atomic concurrency checks to prevent race condition double-bookings.

2. **Skill Verification & Quality Assurance**:
   - Per-skill verification lifecycle (`SELF_DECLARED` $\rightarrow$ `ASSESSMENT_VERIFIED` $\rightarrow$ `PLATFORM_VERIFIED`).
   - Timed skill assessments with passing score thresholds.
   - Dynamic search filtering by verification status (`Verified Only`).

3. **Three-Mode Discovery Engine**:
   - **Mode A (Known Person)**: Search classmates by name (`Rahul`, `Alex`, `David`) with deterministic exact identity match.
   - **Mode B (Known Skill & ML Compatibility)**: Search skills (`Python`, `Solidity`, `Figma`), apply hard filters (availability, proficiency, campus verification), and view explainable **Match Scores (0-100%)**.
   - **Mode C (Multi-Person Network Barter Loops)**: Directed graph cycle finder connecting 3 to 4 students when no direct 1:1 match exists ($A \rightarrow B \rightarrow C \rightarrow A$).

4. **Skill Credits Escrow State Machine**:
   - 1 verified teaching hour = 1 Skill Credit; 1 learning hour = 1 Skill Credit.
   - Credits held in atomic escrow during bookings and settled upon double confirmation.
   - Strict idempotency and double-settlement guards.

5. **Web3 & Solidity Smart Contracts**:
   - `SkillCreditEscrow.sol` (Pausable, ReentrancyGuard, Checks-Effects-Interactions).
   - `VerifiableCredentialNFT.sol` (Soulbound verifiable mentorship badges).
   - `SkillSwapAnchor.sol` (Merkle batch root commitments).
   - Real ECDSA cryptographic signature challenge verification (`personal_sign`).

6. **Fraud & Sybil Defense**:
   - Isolation Forest anomaly model + heuristic rule engine.
   - Detects reciprocal rating loops, rating concentration, burst credit velocity, and wallet address reuse.
   - Human-in-the-loop Moderator Queue (ML scores assist; moderators decide).

7. **Integrated StudySphere Suite**:
   - Campus Study Circles & Jam Groups.
   - Verified Resource & Notes Repository with peer upvoting.
   - Active Recall Flashcards with Spaced Repetition mastery player.
   - AI Study Coach with personalized curriculum roadmaps backed by real campus mentors.

---

## 👥 Demo Accounts

> [!NOTE]
> **These credentials are for local / hackathon demonstration and testing only.**
> The application UI does not display pre-filled credentials. Evaluators should manually enter these credentials into the normal login form at [`/login`](http://localhost:3000/login).

| Role / Scenario | Email | Password | Campus Details & Demonstration Purpose |
| :--- | :--- | :--- | :--- |
| **Student Only** (Python Learner) | `ananya.reddy@campus.edu` | `Password123!` | Sophomore Data Science at Godavari Institute of Computer Science. Has Python learning goal & open Python learner request. Has 4 Skill Credits. |
| **Mentor Only** (Verified Python Mentor) | `rahul.reddy@campus.edu` | `Password123!` | Senior CS Mentor at Andhra Institute of Technology. Teaches Python (`Expert`, `PLATFORM_VERIFIED`, 95% score). Availability Mon/Wed/Fri 5 PM–8 PM. Has existing booked session on Monday 5 PM–6 PM to demonstrate Smart Slot Finder (returning 6 PM–7 PM & 7 PM–8 PM). |
| **Mentor + Student** (Verified Python Mentor & Web3) | `sai.kiran@campus.edu` | `Password123!` | Senior CS & AI at Krishna Valley Engineering College. Teaches Python (`Advanced`, `ASSESSMENT_VERIFIED`) & Solidity (`Expert`, `PLATFORM_VERIFIED`). Learning Figma. Can both earn and spend credits. |
| **Mentor + Student** (Pending Python Mentor) | `sravani@campus.edu` | `Password123!` | Junior IT at Andhra Institute of Technology. Teaches Python (`Advanced`, `SELF_DECLARED` / Verification Pending). Allows testing the *Verified Only* filter toggle. |
| **Student Only** (Finance & Python Request) | `pavan.kumar@campus.edu` | `Password123!` | Senior Finance at Sri Vasavi Institute of Technology. Seeking Python for quantitative trading scripts. Has open Python Learner Request in database. |
| **Mentor + Student** (Design Specialist) | `bhavya.reddy@campus.edu` | `Password123!` | Senior Digital Media at Coastal Andhra University. Top Figma UI/UX Mentor (`PLATFORM_VERIFIED`). Seeking Python for UX analytics. |
| **Mentor + Student** (Math & DSA Specialist) | `vamsi.krishna@campus.edu` | `Password123!` | Junior Applied Math at Vijaya Engineering College. Calculus & DSA Mentor (`PLATFORM_VERIFIED`). Seeking React. |
| **Mentor + Student** (React & Web3) | `keerthana.rao@campus.edu` | `Password123!` | Junior CS at Krishna Valley Engineering College. React Mentor (`PLATFORM_VERIFIED`). Seeking Solidity. |
| **Campus Moderator** | `moderator.sirisha@campus.edu` | `Password123!` | Graduate Student Affairs at Andhra Institute of Technology. Access to Dispute Resolution, Verification Queue & Moderation Dashboard. |
| **Campus Admin** | `admin@skillswap.campus.edu` | `Password123!` | Srinivas Rao (Campus Admin). Access to `/admin`, Emergency Pause, Escrow Overrides, Session Reports & Audit Logs. |

---

## 🛠️ Demo Data Setup & Execution

### 1. Environment Setup
Verify that your `.env` file contains standard local development defaults:
```bash
NEXT_PUBLIC_APP_NAME="SkillSwap Campus"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_URL="./data/skillswap.db"
AUTH_SECRET="skillswap-super-secret-jwt-key-for-local-development-min32bytes"
```

### 2. Run Database Seeding
Execute the database seed script to provision all demo users, skills, availability windows, and Python scenarios:
```bash
npm run seed
```
*(The seed script is idempotent — running it multiple times safely updates and maintains existing records without creating duplicates).*

### 3. Run Automated Verification Tests
```bash
# Run All Core, Smart Slot Finder, Fallback & Role Invariant Test Suites
node --test tests/smart_slot_finder.test.js tests/fallback_discovery.test.js tests/domain.test.js tests/extension.test.js tests/role_auth_demo.test.js
```

### 4. Start the Application
```bash
npm run dev
```

### 5. Access and Test the Platform
1. Open [http://localhost:3000/login](http://localhost:3000/login) in your browser.
2. Manually enter any of the demo accounts documented above.
3. Test student learning, mentor teaching, smart scheduling, outside-college fallback, and admin moderation!
