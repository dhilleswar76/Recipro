# SKILLSWAP CAMPUS

> **"Students exchange skills instead of money."**

SkillSwap Campus is a production-grade campus peer-learning platform and decentralized skill barter economy. Students teach topics they have mastered to earn zero-fee **Skill Credits**, then spend those credits learning subjects they need from other students.

---

## 🌟 Key Highlights & Subsystems

1. **Three-Mode Discovery Engine**:
   - **Mode A (Known Person)**: Search classmate by name (`Rahul`, `Alice`, `David`) with deterministic exact identity prioritization.
   - **Mode B (Known Skill & ML Compatibility)**: Search skills (`Python`, `Solidity`, `Figma`), apply hard filters (availability, level, campus verification), and view explainable **Match Scores (0-100%)**.
   - **Mode C (Multi-Person Network Barter Loops)**: Directed graph cycle finder connecting 3 to 4 students when no direct 1:1 match exists ($A \rightarrow B \rightarrow C \rightarrow A$).

2. **Skill Credits Escrow State Machine**:
   - 1 verified teaching hour = 1 Skill Credit; 1 learning hour = 1 Skill Credit.
   - Credits held in atomic escrow during bookings and settled upon double confirmation.
   - Strict idempotency and double-settlement guards.

3. **Web3 & Solidity Smart Contracts**:
   - `SkillCreditEscrow.sol` (Pausable, ReentrancyGuard, Checks-Effects-Interactions).
   - `VerifiableCredentialNFT.sol` (Soulbound verifiable mentorship badges).
   - `SkillSwapAnchor.sol` (Merkle batch root commitments).
   - Real ECDSA cryptographic signature challenge verification (`personal_sign`).

4. **Fraud & Sybil Defense**:
   - Isolation Forest anomaly model + heuristic rule engine.
   - Detects reciprocal rating loops, rating concentration, burst credit velocity, and wallet address reuse.
   - Human-in-the-loop Moderator Queue (ML scores assist; moderators decide).

5. **Integrated StudySphere Suite**:
   - Campus Study Circles & Jam Groups.
   - Verified Resource & Notes Repository with peer upvoting.
   - Active Recall Flashcards with Spaced Repetition mastery player.
   - AI Study Coach with personalized curriculum roadmaps backed by real campus mentors.

---

## 🚀 Quick Start Guide

### 1. Installation
```bash
npm install
```

### 2. Run Database Seeding
```bash
npm run seed
```

### 3. Run Automated Test Suites
```bash
# Unit & Domain Tests
npm test

# Smart Contract Tests
npm run test:contracts

# 30-Vector Security Red Team Tests
npm run test:security
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo Personas (Quick Switch via Navbar)
- **Alice Chen** (`alice@campus.edu`): Junior CS Student (React / Node.js Mentor, learning Solidity).
- **Rahul Kumar** (`rahul.kumar@campus.edu`): Senior Developer (Top Python & Solidity Mentor with Level 1 Verifiable Credential).
- **Elena Rostova** (`elena.rostova@campus.edu`): Digital Media & UI/UX Designer (Top Figma Mentor).
- **David Kim** (`david.kim@campus.edu`): Applied Mathematics Tutor (Calculus & DSA).
- **QuickSwap Pro** (`botfarm1@external-temp.net`): Synthetic Suspicious Account (Flagged in Moderator Queue for rating reciprocity).
- **Sarah Jenkins** (`moderator.sarah@campus.edu`): Campus Moderator (Access to `/moderator`).
- **Campus Admin** (`admin@skillswap.campus.edu`): Principal Admin & SRE (Access to `/admin`).
