import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StudyProvider } from './context/StudyContext';
import { AppRoutes } from './routes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StudyProvider>
          <AppRoutes />
        </StudyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
