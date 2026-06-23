import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Experiment1 from './components/Experiment1';
import Experiment2 from './components/Experiment2';
import Experiment3 from './components/Experiment3';
import Experiment4 from './components/Experiment4';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'exp1' | 'exp2' | 'exp3' | 'exp4'

  // Dynamic body class adjustment for scrolling/chromebook height fit
  useEffect(() => {
    if (currentView === 'dashboard') {
      document.body.classList.add('dashboard-active');
      document.body.style.overflowY = 'auto';
      document.body.style.height = 'auto';
    } else {
      document.body.classList.remove('dashboard-active');
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    }
  }, [currentView]);

  const handleSelectExperiment = (expId) => {
    setCurrentView(expId);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  return (
    <>
      {currentView === 'dashboard' && (
        <Dashboard onSelectExperiment={handleSelectExperiment} />
      )}
      {currentView === 'exp1' && (
        <Experiment1 onBack={handleBackToDashboard} />
      )}
      {currentView === 'exp2' && (
        <Experiment2 onBack={handleBackToDashboard} />
      )}
      {currentView === 'exp3' && (
        <Experiment3 onBack={handleBackToDashboard} />
      )}
      {currentView === 'exp4' && (
        <Experiment4 onBack={handleBackToDashboard} />
      )}
    </>
  );
}

export default App;
