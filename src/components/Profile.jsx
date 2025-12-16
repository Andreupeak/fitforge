import { useState, useEffect } from 'react';

function Profile() {
    const [profile, setProfile] = useState({
        name: '',
        fitnessLevel: 'beginner',
        goals: ['muscle building'],
        preferredDuration: 30,
        equipment: ['body weight'],
        notifications: true,
        darkMode: true
    });

    const [stats, setStats] = useState({
        totalWorkouts: 0,
        memberSince: null,
        level: 1,
        xp: 0
    });

    useEffect(() => {
        // Load profile from localStorage
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            setProfile(JSON.parse(savedProfile));
        }

        // Calculate stats
        const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
        const firstWorkout = history[0]?.completedAt;

        // Simple XP system: 100 XP per workout
        const xp = history.length * 100;
        const level = Math.floor(xp / 500) + 1;

        setStats({
            totalWorkouts: history.length,
            memberSince: firstWorkout ? new Date(firstWorkout).toLocaleDateString() : 'Today',
            level,
            xp: xp % 500
        });
    }, []);

    const saveProfile = (updates) => {
        const updated = { ...profile, ...updates };
        setProfile(updated);
        localStorage.setItem('userProfile', JSON.stringify(updated));
    };

    const clearAllData = () => {
        if (confirm('This will delete all your workout history and progress. Are you sure?')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const fitnessLevels = ['beginner', 'intermediate', 'advanced'];
    const goalOptions = ['muscle building', 'weight gain', 'strength', 'flexibility', 'general fitness'];
    const equipmentOptions = ['body weight', 'dumbbell', 'resistance band', 'kettlebell', 'barbell'];
    const durationOptions = [15, 20, 30, 45, 60, 90];

    return (
        <div className="page">
            {/* Profile Header */}
            <div className="profile-header">
                <div className="profile-avatar">
                    {profile.name ? profile.name[0].toUpperCase() : '💪'}
                </div>
                <h2 className="profile-name">{profile.name || 'Fitness Warrior'}</h2>
                <div className="profile-level">Level {stats.level} • {stats.xp}/500 XP</div>

                {/* XP Progress Bar */}
                <div style={{
                    width: '60%',
                    height: 6,
                    background: 'var(--bg-secondary)',
                    borderRadius: 3,
                    margin: '12px auto 0',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${(stats.xp / 500) * 100}%`,
                        background: 'var(--accent-gradient)'
                    }} />
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalWorkouts}</div>
                    <div className="stat-label">Workouts</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: 16 }}>{stats.memberSince}</div>
                    <div className="stat-label">Member Since</div>
                </div>
            </div>

            {/* Personal Info */}
            <div className="settings-section">
                <h4 className="settings-title">Personal Info</h4>

                <div className="input-group">
                    <label className="input-label">Your Name</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="Enter your name"
                        value={profile.name}
                        onChange={e => saveProfile({ name: e.target.value })}
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">Fitness Level</label>
                    <select
                        className="input"
                        value={profile.fitnessLevel}
                        onChange={e => saveProfile({ fitnessLevel: e.target.value })}
                    >
                        {fitnessLevels.map(level => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Workout Preferences */}
            <div className="settings-section">
                <h4 className="settings-title">Workout Preferences</h4>

                <div className="input-group">
                    <label className="input-label">Default Duration</label>
                    <select
                        className="input"
                        value={profile.preferredDuration}
                        onChange={e => saveProfile({ preferredDuration: parseInt(e.target.value) })}
                    >
                        {durationOptions.map(mins => (
                            <option key={mins} value={mins}>{mins} minutes</option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <label className="input-label">Fitness Goals</label>
                    <div className="chip-group">
                        {goalOptions.map(goal => (
                            <button
                                key={goal}
                                className={`chip ${profile.goals?.includes(goal) ? 'active' : ''}`}
                                onClick={() => {
                                    const goals = profile.goals?.includes(goal)
                                        ? profile.goals.filter(g => g !== goal)
                                        : [...(profile.goals || []), goal];
                                    saveProfile({ goals });
                                }}
                            >
                                {goal}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">Available Equipment</label>
                    <div className="chip-group">
                        {equipmentOptions.map(equip => (
                            <button
                                key={equip}
                                className={`chip ${profile.equipment?.includes(equip) ? 'active' : ''}`}
                                onClick={() => {
                                    const equipment = profile.equipment?.includes(equip)
                                        ? profile.equipment.filter(e => e !== equip)
                                        : [...(profile.equipment || []), equip];
                                    saveProfile({ equipment });
                                }}
                            >
                                {equip}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* App Settings */}
            <div className="settings-section">
                <h4 className="settings-title">App Settings</h4>

                <div className="settings-item">
                    <span className="settings-item-label">Push Notifications</span>
                    <div
                        className={`toggle ${profile.notifications ? 'active' : ''}`}
                        onClick={() => saveProfile({ notifications: !profile.notifications })}
                    />
                </div>

                <div className="settings-item">
                    <span className="settings-item-label">Dark Mode</span>
                    <div
                        className={`toggle ${profile.darkMode ? 'active' : ''}`}
                        onClick={() => saveProfile({ darkMode: !profile.darkMode })}
                    />
                </div>
            </div>

            {/* Achievements */}
            <div className="settings-section">
                <h4 className="settings-title">Achievements</h4>
                <div className="card">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                        <Achievement
                            icon="🌟"
                            name="First Workout"
                            unlocked={stats.totalWorkouts >= 1}
                        />
                        <Achievement
                            icon="🔥"
                            name="7 Day Streak"
                            unlocked={false}
                        />
                        <Achievement
                            icon="💪"
                            name="10 Workouts"
                            unlocked={stats.totalWorkouts >= 10}
                        />
                        <Achievement
                            icon="🏆"
                            name="Level 5"
                            unlocked={stats.level >= 5}
                        />
                        <Achievement
                            icon="⚡"
                            name="Speed Demon"
                            unlocked={false}
                        />
                        <Achievement
                            icon="🎯"
                            name="Goal Setter"
                            unlocked={profile.goals?.length > 0}
                        />
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="settings-section">
                <h4 className="settings-title">Data</h4>
                <button
                    className="btn btn-danger btn-block"
                    onClick={clearAllData}
                >
                    🗑️ Clear All Data
                </button>
            </div>

            <div style={{ height: 40 }} />
        </div>
    );
}

function Achievement({ icon, name, unlocked }) {
    return (
        <div style={{
            textAlign: 'center',
            opacity: unlocked ? 1 : 0.3,
            filter: unlocked ? 'none' : 'grayscale(100%)'
        }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{name}</div>
        </div>
    );
}

export default Profile;
