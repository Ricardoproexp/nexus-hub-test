import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';

const Dashboard: React.FC = () => (
  <DashboardLayout>
    <div className="-m-4 md:-m-6">
      <DashboardContent />
    </div>
  </DashboardLayout>
);

export default Dashboard;
