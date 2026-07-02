import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background-primary text-text-primary">
        <header className="border-b border-border-subtle p-6 text-center">
          <h1 className="text-3xl font-extrabold text-brand-primary tracking-tight">Sweatly</h1>
          <p className="text-text-secondary text-sm">
            Enterprise Fitness & Sports Monorepo Foundation
          </p>
        </header>

        <main className="flex-grow flex items-center justify-center p-6">
          <Routes>
            <Route
              path="/"
              element={
                <div className="glow-card p-8 max-w-md w-full text-center">
                  <h2 className="text-2xl font-bold mb-4">Foundation Bootstrapped</h2>
                  <p className="text-text-secondary mb-6 text-sm">
                    React + TypeScript + Tailwind CSS + React Query + Zustand project foundation is
                    successfully configured and ready for feature implementation.
                  </p>
                  <button className="btn-primary w-full">Get Started</button>
                </div>
              }
            />
            {/* Catch-all redirect to home page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
