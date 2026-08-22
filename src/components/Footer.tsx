import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Cpu, Database, HeartHandshake } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 mt-20 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-white">SKILLSWAP CAMPUS</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Decentralized campus peer-learning economy where students exchange skills instead of money.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-brand-400">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
              <span>Campus DevNet (Chain 31337) Operational</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">Discovery Modes</h4>
            <ul className="space-y-2">
              <li><Link href="/explore?mode=MODE_A" className="hover:text-brand-400 transition-colors">Mode A — Known Person (Exact Identity)</Link></li>
              <li><Link href="/explore?mode=MODE_B" className="hover:text-brand-400 transition-colors">Mode B — Known Skill & ML Match</Link></li>
              <li><Link href="/explore?mode=MODE_C" className="hover:text-brand-400 transition-colors">Mode C — Multi-Person Barter Loops</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">Campus Tools</h4>
            <ul className="space-y-2">
              <li><Link href="/studysphere" className="hover:text-brand-400 transition-colors">StudySphere Hub & Jam Groups</Link></li>
              <li><Link href="/study-coach" className="hover:text-brand-400 transition-colors">AI Study Coach & Roadmaps</Link></li>
              <li><Link href="/credentials" className="hover:text-brand-400 transition-colors">Verifiable Credentials & Badges</Link></li>
              <li><Link href="/wallet" className="hover:text-brand-400 transition-colors">Escrow Ledger & Blockchain Proofs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">Architecture & Trust</h4>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                <span>Zero-Fee Skill Credits Escrow</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-accent-400" />
                <span>Isolation Forest Fraud Detection</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Deterministic Identity Matching First</span>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 SkillSwap Campus. Built for campus hackathons. All transactions verifiable on-chain.</p>
          <div className="flex gap-4">
            <Link href="/admin" className="hover:text-slate-400">System SRE Status</Link>
            <Link href="/moderator" className="hover:text-slate-400">Moderation Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
