import { useState, useEffect, useMemo } from 'react';

function ProgressDashboard() {
    const [workoutHistory, setWorkoutHistory] = useState([]);
    const [streakData, setStreakData] = useState({ workoutDays: [] });
    const [measurements, setMeasurements] = useState({});
    const [showAddMeasurement, setShowAddMeasurement] = useState(false);
    const [newWeight, setNewWeight] = useState('');

    useEffect(() => {
        // Load data from localStorage
        const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
        const streak = JSON.parse(localStorage.getItem('streakData') || '{"workoutDays":[]}');
        const measures = JSON.parse(localStorage.getItem('measurements') || '{}');

        setWorkoutHistory(history);
        setStreakData(streak);
        setMeasurements(measures);
    }, []);

    // Calculate stats
    const stats = useMemo(() => {
        const now = new Date();
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        const weekWorkouts = workoutHistory.filter(w =>
            new Date(w.completedAt) >= weekAgo
        );

        const monthWorkouts = workoutHistory.filter(w =>
            new Date(w.completedAt) >= monthAgo
        );

        const totalMinutes = workoutHistory.reduce((acc, w) =>
            acc + (w.duration || 0), 0
        ) / 60;

        // Calculate current streak
        let currentStreak = 0;
        const today = new Date().toDateString();
        const sortedDays = [...(streakData.workoutDays || [])]
            .map(d => new Date(d))
            .sort((a, b) => b - a);

        if (sortedDays.length > 0) {
            let checkDate = new Date();
            for (const day of sortedDays) {
                if (day.toDateString() === checkDate.toDateString()) {
                    currentStreak++;
                    checkDate = new Date(checkDate - 24 * 60 * 60 * 1000);
                } else if (day < checkDate) {
                    break;
                }
            }
        }

        return {
            totalWorkouts: workoutHistory.length,
            weekWorkouts: weekWorkouts.length,
            monthWorkouts: monthWorkouts.length,
            totalMinutes: Math.round(totalMinutes),
            currentStreak
        };
    }, [workoutHistory, streakData]);

    // Generate calendar days for last 28 days
    const calendarDays = useMemo(() => {
        const days = [];
        const today = new Date();

        for (let i = 27; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            const isWorkoutDay = streakData.workoutDays?.some(
                d => new Date(d).toDateString() === date.toDateString()
            );

            days.push({
                date,
                day: date.getDate(),
                isToday: date.toDateString() === today.toDateString(),
                hasWorkout: isWorkoutDay
            });
        }

        return days;
    }, [streakData]);

    // Weight history
    const weightHistory = useMemo(() => {
        return Object.entries(measurements)
            .filter(([key]) => key.startsWith('weight_'))
            .map(([key, value]) => ({
                date: key.replace('weight_', ''),
                weight: parseFloat(value)
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-10);
    }, [measurements]);

    const handleAddWeight = () => {
        if (!newWeight) return;

        const today = new Date().toISOString().split('T')[0];
        const updated = {
            ...measurements,
            [`weight_${today}`]: parseFloat(newWeight)
        };

        setMeasurements(updated);
        localStorage.setItem('measurements', JSON.stringify(updated));
        setNewWeight('');
        setShowAddMeasurement(false);
    };

    return (
        <div className="page">
            <header className="page-header">
                <h1 className="page-title">Progress</h1>
                <p className="page-subtitle">Track your fitness journey</p>
            </header>

            {/* Quick Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">🔥 {stats.currentStreak}</div>
                    <div className="stat-label">Day Streak</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.weekWorkouts}</div>
                    <div className="stat-label">This Week</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.monthWorkouts}</div>
                    <div className="stat-label">This Month</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalMinutes}</div>
                    <div className="stat-label">Total Minutes</div>
                </div>
            </div>

            {/* Streak Calendar */}
            <div className="card">
                <h3 className="card-title">📅 Workout Calendar</h3>
                <div className="streak-calendar">
                    {calendarDays.map((day, i) => (
                        <div
                            key={i}
                            className={`calendar-day ${day.hasWorkout ? 'active' : ''} ${day.isToday ? 'today' : ''}`}
                            title={day.date.toLocaleDateString()}
                        >
                            {day.day}
                        </div>
                    ))}
                </div>
                <p className="text-muted text-center" style={{ marginTop: 12, fontSize: 12 }}>
                    Last 4 weeks
                </p>
            </div>

            {/* Weight Tracking */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 className="card-title" style={{ margin: 0 }}>⚖️ Weight Tracking</h3>
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setShowAddMeasurement(!showAddMeasurement)}
                    >
                        + Log
                    </button>
                </div>

                {showAddMeasurement && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <input
                            type="number"
                            className="input"
                            placeholder="Weight (kg)"
                            value={newWeight}
                            onChange={e => setNewWeight(e.target.value)}
                            step="0.1"
                        />
                        <button className="btn btn-primary" onClick={handleAddWeight}>
                            Save
                        </button>
                    </div>
                )}

                {weightHistory.length > 0 ? (
                    <div>
                        {/* Simple bar chart representation */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            height: 100,
                            gap: 4,
                            marginBottom: 16
                        }}>
                            {weightHistory.map((entry, i) => {
                                const min = Math.min(...weightHistory.map(e => e.weight));
                                const max = Math.max(...weightHistory.map(e => e.weight));
                                const range = max - min || 1;
                                const height = ((entry.weight - min) / range) * 80 + 20;

                                return (
                                    <div
                                        key={i}
                                        style={{
                                            flex: 1,
                                            height: `${height}%`,
                                            background: 'var(--accent-gradient)',
                                            borderRadius: 4,
                                            position: 'relative'
                                        }}
                                        title={`${entry.date}: ${entry.weight}kg`}
                                    />
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-muted" style={{ fontSize: 12 }}>
                                Start: {weightHistory[0]?.weight}kg
                            </span>
                            <span className="text-muted" style={{ fontSize: 12 }}>
                                Current: {weightHistory[weightHistory.length - 1]?.weight}kg
                            </span>
                        </div>
                    </div>
                ) : (
                    <p className="text-muted text-center">Log your weight to track progress</p>
                )}
            </div>

            {/* Recent Workouts */}
            <div className="card">
                <h3 className="card-title">🏋️ Recent Workouts</h3>

                {workoutHistory.length > 0 ? (
                    <div>
                        {workoutHistory.slice(-5).reverse().map((workout, i) => (
                            <div key={i} className="settings-item">
                                <div>
                                    <div className="font-bold">{workout.name}</div>
                                    <div className="text-muted" style={{ fontSize: 12 }}>
                                        {workout.completedAt ? new Date(workout.completedAt).toLocaleDateString() : 'In progress'}
                                    </div>
                                </div>
                                <div className="text-secondary">
                                    {workout.duration ? `${Math.round(workout.duration / 60)}min` : '--'}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted text-center">Complete a workout to see it here</p>
                )}
            </div>

            {/* Recovery Status */}
            <div className="card">
                <h3 className="card-title">💤 Recovery Status</h3>
                <RecoveryStatus workoutHistory={workoutHistory} />
            </div>
        </div>
    );
}

function RecoveryStatus({ workoutHistory }) {
    const [recovery, setRecovery] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const lastWorkout = workoutHistory[workoutHistory.length - 1];

        if (!lastWorkout?.completedAt) {
            setLoading(false);
            return;
        }

        fetch('/api/recovery/estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workout: lastWorkout,
                previousWorkouts: workoutHistory.slice(-5)
            })
        })
            .then(r => r.json())
            .then(setRecovery)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [workoutHistory]);

    if (loading) {
        return <div className="text-muted text-center">Calculating...</div>;
    }

    if (!recovery) {
        return <p className="text-muted text-center">Complete a workout to see recovery status</p>;
    }

    const hoursRemaining = Math.max(0,
        (new Date(recovery.nextWorkoutDate) - new Date()) / (1000 * 60 * 60)
    );
    const recoveryPercent = Math.min(100, (1 - hoursRemaining / recovery.estimatedHours) * 100);

    return (
        <div>
            <div style={{
                height: 8,
                background: 'var(--bg-secondary)',
                borderRadius: 4,
                overflow: 'hidden',
                marginBottom: 12
            }}>
                <div
                    style={{
                        height: '100%',
                        width: `${recoveryPercent}%`,
                        background: recoveryPercent >= 100 ? 'var(--accent-success)' : 'var(--accent-gradient)',
                        transition: 'width 0.5s ease'
                    }}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="text-secondary">Recovery Progress</span>
                <span className={recoveryPercent >= 100 ? 'text-success' : ''}>
                    {Math.round(recoveryPercent)}%
                </span>
            </div>

            <p className="text-muted" style={{ fontSize: 14 }}>
                {recovery.recommendation}
            </p>

            {recovery.musclesWorked?.length > 0 && (
                <div className="chip-group" style={{ marginTop: 12 }}>
                    {recovery.musclesWorked.map(muscle => (
                        <span key={muscle} className="chip">{muscle}</span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ProgressDashboard;
