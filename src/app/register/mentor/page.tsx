'use client';

import React from 'react';
import { RegisterForm } from '@/components/RegisterForm';

export default function MentorRegisterPage() {
  return (
    <RegisterForm 
      initialUserType="TEACHER"
      roleTitle="Register as Mentor"
      roleBadge="Teacher Registration"
      roleDescription="Create your campus mentor profile to list teaching topics, complete skill assessments, set availability, and earn zero-fee Skill Credits."
    />
  );
}
