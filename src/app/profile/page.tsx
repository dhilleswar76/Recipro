'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Brain, 
  Clock, 
  Award, 
  ShieldCheck, 
  BookOpen, 
  Target, 
  Calendar,
  X,
  Coins
} from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'SKILLS' | 'GOALS' | 'AVAILABILITY'>('SKILLS');

  // AI Extraction State
  const [extractModalOpen, setExtractModalOpen] = useState(false);
  const [extractText, setExtractText] = useState('I built three React websites, a Node.js backend with Express, and worked with MongoDB and REST APIs. I also have 2 years of Python scripting experience for data analysis.');
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<any[]>([]);

  // Manual Add Skill State
  const [addSkillModalOpen, setAddSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newCategory, setNewCategory] = useState('Computer Science');
  const [newProficiency, setNewProficiency] = useState('Intermediate');
  const [newExp, setNewExp] = useState(1);
  const [newStyle, setNewStyle] = useState('Hands-on project reviews & coding sessions');

  // Manual Add Goal State
  const [addGoalModalOpen, setAddGoalModalOpen] = useState(false);
  const [goalSkillName, setGoalSkillName] = useState('');
  const [goalCategory, setGoalCategory] = useState('Computer Science');
  const [goalTarget, setGoalTarget] = useState('Intermediate');
  const [goalPriority, setGoalPriority] = useState('HIGH');
  const [goalNotes, setGoalNotes] = useState('');

  // Availability State
  const [availSlots, setAvailSlots] = useState<any[]>([]);
  const [newDay, setNewDay] = useState('Monday');
  const [newStart, setNewStart] = useState('18:00');
  const [newEnd, setNewEnd] = useState('20:00');

  useEffect(() => {
    fetchAvailability();
  }, [user]);

  const fetchAvailability = async () => {
    try {
      const res = await fetch('/api/availability');
      if (res.ok) {
        const data = await res.json();
        setAvailSlots(data.slots || []);
      }
    } catch (err) {
      console.error('Failed to fetch availability:', err);
    }
  };

  // Run AI Skill Extractor
  const handleAnalyzeSkills = async () => {
    setExtractLoading(true);
    try {
      const res = await fetch('/api/skills/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freeText: extractText }),
      });
      if (res.ok) {
        const data = await res.json();
        setExtractedSkills(data.skills || []);
      }
    } catch (err) {
      console.error('Skill extraction error:', err);
    } finally {
      setExtractLoading(false);
    }
  };

  // Add individual extracted skill to profile
  const handleAcceptExtractedSkill = async (skill: any) => {
    try {
      await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: skill.skillName,
          category: skill.category,
          proficiency: skill.proficiency,
          experienceYears: 1,
          teachingStyle: 'Hands-on practice & examples',
          verificationStatus: 'AI_SUGGESTED',
        }),
      });
      await refreshUser();
      // Remove from extracted view
      setExtractedSkills(prev => prev.filter(s => s.skillName !== skill.skillName));
    } catch (err) {
      console.error('Failed to save skill:', err);
    }
  };

  // Manual Add Skill
  const handleAddManualSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: newSkillName,
          category: newCategory,
          proficiency: newProficiency,
          experienceYears: Number(newExp),
          teachingStyle: newStyle,
          verificationStatus: 'CLAIMED',
        }),
      });
      setAddSkillModalOpen(false);
      setNewSkillName('');
      await refreshUser();
    } catch (err) {
      console.error('Failed to add skill:', err);
    }
  };

  // Manual Add Goal
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: goalSkillName,
          category: goalCategory,
          targetProficiency: goalTarget,
          priority: goalPriority,
          notes: goalNotes,
        }),
      });
      setAddGoalModalOpen(false);
      setGoalSkillName('');
      setGoalNotes('');
      await refreshUser();
    } catch (err) {
      console.error('Failed to add goal:', err);
    }
  };

  // Add Availability Slot
  const handleAddSlot = async () => {
    const updated = [...availSlots, { dayOfWeek: newDay, startTime: newStart, endTime: newEnd }];
    setAvailSlots(updated);
    await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots: updated }),
    });
  };

  const handleRemoveSlot = async (idx: number) => {
    const updated = availSlots.filter((_, i) => i !== idx);
    setAvailSlots(updated);
    await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots: updated }),
    });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-slate-400">
        <p>Please log in to manage your campus profile and skills.</p>
      </div>
    );
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      
      {/* Student Profile Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-accent-600 flex items-center justify-center text-dark-bg font-extrabold text-2xl shadow-glow-brand">
              {user.display_name?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-white">{user.display_name}</h1>
                {user.is_verified_student && (
                  <span className="flex items-center gap-1 text-xs text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded-full border border-brand-500/30 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Student
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {user.campusId || 'STU-102948'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {user.college} • {user.major} ({user.year})
              </p>
              <p className="text-xs text-slate-300 mt-2 max-w-2xl">{user.bio || 'Campus peer learner & mentor.'}</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-around sm:justify-end bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <div className="text-center px-2">
              <div className="text-xs text-slate-400">Trust Score</div>
              <div className="text-base font-bold text-brand-400">{user.trust_score}%</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center px-2">
              <div className="text-xs text-slate-400">Completion</div>
              <div className="text-base font-bold text-white">{user.completion_rate}%</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center px-2">
              <div className="text-xs text-slate-400">Balance</div>
              <div className="text-base font-bold text-accent-400">{user.balance} Credits</div>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs: Teaching Skills | Learning Goals | Availability Matrix */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('SKILLS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'SKILLS' ? 'bg-brand-500 text-dark-bg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Skills I Can Teach ({user.skills?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('GOALS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'GOALS' ? 'bg-accent-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" /> Skills I Want to Learn ({user.goals?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('AVAILABILITY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'AVAILABILITY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" /> My Availability ({availSlots.length} slots)
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: TEACHING SKILLS & AI EXTRACTOR */}
        {/* ============================================================ */}
        {activeTab === 'SKILLS' && (
          <div className="space-y-6">
            
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Skills You Teach</h2>
                <p className="text-xs text-slate-400">Students request sessions with you for these topics.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExtractModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-accent transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" /> Analyze My Skills (AI)
                </button>
                <button
                  onClick={() => setAddSkillModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Skill
                </button>
              </div>
            </div>

            {/* Teaching Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.skills?.map((skill: any) => (
                <div key={skill.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm">{skill.skill_name}</h3>
                      <p className="text-[11px] text-slate-400">{skill.skill_category}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30">
                      {skill.proficiency}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 italic pt-1">&ldquo;{skill.teaching_style}&rdquo;</p>
                  
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{skill.experience_years} years experience</span>
                    <span className="text-brand-400 font-medium">1 Credit / hr</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: LEARNING GOALS */}
        {/* ============================================================ */}
        {activeTab === 'GOALS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Learning Goals</h2>
                <p className="text-xs text-slate-400">Used by the ML engine to recommend matching mentors &amp; barter cycles.</p>
              </div>
              <button
                onClick={() => setAddGoalModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Learning Goal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.goals?.map((goal: any) => (
                <div key={goal.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm">{goal.skill_name}</h3>
                      <p className="text-[11px] text-slate-400">{goal.skill_category}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-accent-500/20 text-accent-300 font-bold">
                      Target: {goal.target_proficiency}
                    </span>
                  </div>
                  {goal.notes && <p className="text-xs text-slate-300 pt-1">{goal.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: AVAILABILITY MATRIX */}
        {/* ============================================================ */}
        {activeTab === 'AVAILABILITY' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">Weekly Availability Schedule</h2>
              <p className="text-xs text-slate-400">When you are free to teach or join peer learning sessions.</p>
            </div>

            {/* Add Slot Control */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3">
              <select
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
              >
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <input
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
              />
              <span className="text-slate-500 text-xs">to</span>
              <input
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
              />

              <button
                onClick={handleAddSlot}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Time Slot
              </button>
            </div>

            {/* List Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availSlots.map((slot, idx) => (
                <div key={idx} className="glass-panel p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-brand-400" />
                    <div>
                      <div className="font-semibold text-white">{slot.dayOfWeek || slot.day_of_week}</div>
                      <div className="text-[11px] text-slate-400">{slot.startTime || slot.start_time} - {slot.endTime || slot.end_time}</div>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveSlot(idx)} className="text-slate-500 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ============================================================ */}
      {/* MODAL: AI SKILL EXTRACTOR ("Analyze My Skills") */}
      {/* ============================================================ */}
      {extractModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => setExtractModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-500 to-indigo-600 flex items-center justify-center text-white shadow-glow-accent">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">AI Skill Analyzer</h3>
                <p className="text-xs text-slate-400">Extract skills from your project descriptions, bio, or resume text</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Experience / Projects Text
                </label>
                <textarea 
                  value={extractText}
                  onChange={(e) => setExtractText(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
                  placeholder="Describe projects you built, languages used, frameworks, courses completed..."
                />
              </div>

              <button
                onClick={handleAnalyzeSkills}
                disabled={extractLoading || !extractText.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-accent transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {extractLoading ? 'Analyzing Text with NLP & Gemini...' : 'Analyze & Extract Skills'}
              </button>

              {/* Extracted Skills Preview & Confirmation */}
              {extractedSkills.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-brand-300 uppercase tracking-wider">
                      Extracted Candidate Skills ({extractedSkills.length})
                    </h4>
                    <span className="text-[10px] text-slate-400">Review &amp; click accept to add to your profile</span>
                  </div>

                  <div className="space-y-2.5">
                    {extractedSkills.map((sk, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{sk.skillName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-semibold">
                              {sk.proficiency} ({sk.confidence}%)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{sk.evidence}</p>
                        </div>

                        <button
                          onClick={() => handleAcceptExtractedSkill(sk)}
                          className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" /> Accept Skill
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: MANUAL ADD SKILL */}
      {/* ============================================================ */}
      {addSkillModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddManualSkill} className="glass-panel w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl p-6 relative space-y-4">
            <button type="button" onClick={() => setAddSkillModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white">Add Teaching Skill</h3>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Skill Name</label>
              <input 
                type="text"
                required
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="E.g., PyTorch, Rust, Graphic Design..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2">
                  <option value="Computer Science">Computer Science</option>
                  <option value="Design">Design</option>
                  <option value="Languages">Languages</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Business">Business</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Proficiency</label>
                <select value={newProficiency} onChange={(e) => setNewProficiency(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Teaching Style</label>
              <input 
                type="text"
                value={newStyle}
                onChange={(e) => setNewStyle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <button type="submit" className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs transition-colors">
              Save Skill to Profile
            </button>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: MANUAL ADD GOAL */}
      {/* ============================================================ */}
      {addGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddGoal} className="glass-panel w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl p-6 relative space-y-4">
            <button type="button" onClick={() => setAddGoalModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white">Add Learning Goal</h3>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Skill You Want to Learn</label>
              <input 
                type="text"
                required
                value={goalSkillName}
                onChange={(e) => setGoalSkillName(e.target.value)}
                placeholder="E.g., Solidity, Data Structures, Spanish..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Level</label>
                <select value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                <select value={goalPriority} onChange={(e) => setGoalPriority(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2">
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Goal Notes</label>
              <textarea 
                value={goalNotes}
                onChange={(e) => setGoalNotes(e.target.value)}
                rows={2}
                placeholder="Why do you want to learn this?"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent-500"
              />
            </div>

            <button type="submit" className="w-full py-2.5 rounded-xl bg-accent-500 hover:bg-accent-400 text-white font-bold text-xs transition-colors">
              Save Goal
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
