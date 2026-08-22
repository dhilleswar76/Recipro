'use client';

import React from 'react';
import { RegisterForm } from '@/components/RegisterForm';

export default function StudentRegisterPage() {
  return (
    <RegisterForm 
      initialUserType="LEARNER"
      roleTitle="Register as Student"
      roleBadge="Learner Registration"
      roleDescription="Create your student profile to find verified mentors, schedule sessions with Smart Slot Finder, and learn skills using starter credits."
    />
  );
}
