
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '@/context/CompanyContext';
import Logo from '@/components/common/Logo';
import CompanyInfoForm from '@/components/registration/CompanyInfoForm';
import SegmentSelection from '@/components/registration/SegmentSelection';
import SubscriptionPlans from '@/components/registration/SubscriptionPlans';

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const { setIsRegistrationComplete } = useCompany();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const handleNext = () => {
    setStep((prev) => (prev === 3 ? prev : (prev + 1) as 1 | 2 | 3));
  };
  
  const handleBack = () => {
    setStep((prev) => (prev === 1 ? prev : (prev - 1) as 1 | 2 | 3));
  };
  
  const handleComplete = () => {
    setIsRegistrationComplete(true);
    navigate('/onboarding');
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
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full 
                    ${step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {s}
                  </div>
                  <span 
                    className={`ml-2 text-sm hidden sm:inline ${step >= s ? 'text-primary' : 'text-gray-500'}`}
                  >
                    {s === 1 && 'Dados da Empresa'}
                    {s === 2 && 'Segmento'}
                    {s === 3 && 'Plano'}
                  </span>
                  {s < 3 && (
                    <div className={`h-px w-12 sm:w-24 mx-2 ${step > s ? 'bg-primary' : 'bg-gray-300'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white shadow-sm rounded-lg p-6 sm:p-8">
            {step === 1 && <CompanyInfoForm onNext={handleNext} />}
            {step === 2 && <SegmentSelection onNext={handleNext} onBack={handleBack} />}
            {step === 3 && <SubscriptionPlans onComplete={handleComplete} onBack={handleBack} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;
