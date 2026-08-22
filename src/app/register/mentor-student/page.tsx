'use client';

import React from 'react';
import { RegisterForm } from '@/components/RegisterForm';

export default function MentorStudentRegisterPage() {
  return (
    <RegisterForm 
      initialUserType="TEACHER_LEARNER"
      roleTitle="Register as Mentor + Student"
      roleBadge="Full Barter Registration"
      roleDescription="Join the full SkillSwap ecosystem: teach what you already know to earn Skill Credits, and spend them learning new subjects from fellow classmates."
    />
  );
}
