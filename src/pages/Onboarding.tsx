
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingProvider, useOnboarding } from '@/context/OnboardingContext';
import Logo from '@/components/common/Logo';
import OnboardingSteps from '@/components/onboarding/OnboardingSteps';

const OnboardingContent: React.FC = () => {
  const navigate = useNavigate();
  const { isOnboardingComplete } = useOnboarding();
  
  if (isOnboardingComplete) {
    navigate('/dashboard');
  }
  
  const handleComplete = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="py-6 px-4 sm:px-6 lg:px-8 border-b bg-white">
        <div className="max-w-5xl mx-auto">
          <Logo />
        </div>
      </div>
      
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <OnboardingSteps onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
};

const Onboarding: React.FC = () => {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
};

export default Onboarding;
