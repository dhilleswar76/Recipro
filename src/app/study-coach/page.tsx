'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Brain, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  ShieldCheck, 
  Calendar, 
  Coins, 
  BookOpen 
} from 'lucide-react';

export default function StudyCoachPage() {
  const [topic, setTopic] = useState('Solidity & Smart Contracts');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/ai/study-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Study coach error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sampleTopics = ['Solidity & Smart Contracts', 'Python & Machine Learning', 'React & Next.js', 'UI/UX Design & Figma'];

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
          <Brain className="w-3.5 h-3.5" /> AI Study Coach &amp; Mentor Matching
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
          Personalized Learning Roadmaps
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter any topic you want to master. The AI creates a modular curriculum and connects you with real, verified campus mentors.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleGenerateRoadmap} className="max-w-xl mx-auto glass-panel p-2 rounded-2xl border border-slate-700 shadow-2xl flex items-center gap-2">
        <input 
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="E.g., Solidity, PyTorch, Design Systems..."
          className="flex-1 bg-transparent px-3 text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-accent-600 hover:from-indigo-500 hover:to-accent-500 text-white font-bold text-xs shadow-glow-accent transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          {loading ? 'Building Curriculum...' : 'Generate Roadmap'} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Topic Suggestions */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
        <span>Suggested:</span>
        {sampleTopics.map(st => (
          <button
            key={st}
            onClick={() => setTopic(st)}
            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            {st}
          </button>
        ))}
      </div>

      {/* Output Content */}
      {result && (
        <div className="space-y-10 animate-in fade-in duration-300">
          
          {/* Ground Truth Banner */}
          <div className="glass-panel p-3.5 rounded-2xl border border-brand-500/30 bg-brand-950/30 text-xs text-brand-300 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
            <span>
              <strong>Verified Ground Truth:</strong> All recommended mentors below are queried directly from campus records with verified ratings (Zero Hallucinated Facts).
            </span>
          </div>

          {/* 1. Step-by-Step Curriculum Roadmap */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent-400" />
              <h2 className="text-lg font-bold text-white">Curriculum Roadmap: {result.topic}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.roadmap?.map((step: any) => (
                <div key={step.step} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                      Module {step.step}
                    </span>
                    <span className="text-[11px] text-slate-500">1 Credit / hr</span>
                  </div>
                  <h3 className="font-bold text-white text-sm">{step.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Recommended Verified Campus Mentors */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-400" />
              <h2 className="text-lg font-bold text-white">Recommended Mentors for this Roadmap</h2>
            </div>

            {result.recommendedMentors?.length === 0 ? (
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                No active mentors currently listed for this specific roadmap. Try exploring Mode C exchange cycles!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {result.recommendedMentors.map((mentor: any) => (
                  <div key={mentor.userId} className="glass-panel p-5 rounded-2xl border border-slate-800 glass-panel-hover flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-accent-600 flex items-center justify-center text-dark-bg font-extrabold text-sm">
                            {mentor.displayName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-sm">{mentor.displayName}</h3>
                            <p className="text-[11px] text-slate-400">{mentor.college}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{mentor.bayesianRating.toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{mentor.skillName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold">
                            {mentor.proficiency}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 italic">&ldquo;{mentor.teachingStyle}&rdquo;</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">{mentor.totalSessionsTaught} sessions taught</span>
                      <Link
                        href={`/explore?q=${encodeURIComponent(mentor.displayName)}`}
                        className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs transition-colors flex items-center gap-1"
                      >
                        Request Mentor <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
