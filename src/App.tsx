import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { StudyProvider } from './context/StudyContext';
import { AppRoutes } from './routes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <StudyProvider>
        <AppRoutes />
      </StudyProvider>
    </BrowserRouter>
  );
};

export default App;
