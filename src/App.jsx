import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import WorkoutGenerator from './components/WorkoutGenerator';
import ExerciseLibrary from './components/ExerciseLibrary';
import ProgressDashboard from './components/ProgressDashboard';
import AICoach from './components/AICoach';
import Profile from './components/Profile';
import WorkoutPlayer from './components/WorkoutPlayer';

function AppContent() {
    const location = useLocation();
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);

    // Check for PWA updates
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker?.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            setUpdateAvailable(true);
                        }
                    });
                });
            });
        }
    }, []);

    const handleUpdate = () => {
        window.location.reload();
    };

    // Don't show navigation during active workout
    const showNav = !activeWorkout && location.pathname !== '/workout-player';

    return (
        <div className="app">
            {updateAvailable && (
                <div className="update-banner" onClick={handleUpdate}>
                    <span>🔄 Update available! Tap to refresh</span>
                </div>
            )}

            <main className="main-content">
                <Routes>
                    <Route path="/" element={<WorkoutGenerator onStartWorkout={setActiveWorkout} />} />
                    <Route path="/library" element={<ExerciseLibrary />} />
                    <Route path="/progress" element={<ProgressDashboard />} />
                    <Route path="/coach" element={<AICoach />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/workout-player" element={
                        <WorkoutPlayer
                            workout={activeWorkout}
                            onComplete={() => setActiveWorkout(null)}
                        />
                    } />
                </Routes>
            </main>

            {showNav && <Navigation />}
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
