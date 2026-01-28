
import React, { useState, useEffect } from 'react';
import Onboarding from './Onboarding';
import ChatInterface from './ChatInterface';
import { UserProfile } from '../types';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('atlas_profile');
    if (saved) {
      setUserProfile(JSON.parse(saved));
    }
  }, []);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('atlas_profile', JSON.stringify(profile));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0e14]">
      {!userProfile ? (
        <Onboarding 
          onComplete={handleOnboardingComplete} 
        />
      ) : (
        <ChatInterface profile={userProfile} />
      )}
    </div>
  );
};

export default App;
