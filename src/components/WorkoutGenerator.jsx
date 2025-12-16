import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function WorkoutGenerator({ onStartWorkout }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [generatedWorkout, setGeneratedWorkout] = useState(null);

    const [preferences, setPreferences] = useState({
        goals: ['muscle building'],
        duration: 30,
        equipment: ['body weight'],
        targetMuscles: [],
        fitnessLevel: 'beginner'
    });

    const goalOptions = [
        { id: 'muscle building', label: '💪 Build Muscle', icon: '💪' },
        { id: 'weight gain', label: '⬆️ Gain Weight', icon: '⬆️' },
        { id: 'strength', label: '🏋️ Strength', icon: '🏋️' },
        { id: 'flexibility', label: '🧘 Flexibility', icon: '🧘' },
        { id: 'general fitness', label: '❤️ General Fitness', icon: '❤️' }
    ];

    const durationOptions = [15, 20, 30, 45, 60, 90];

    const equipmentOptions = [
        { id: 'body weight', label: 'Bodyweight' },
        { id: 'dumbbell', label: 'Dumbbells' },
        { id: 'resistance band', label: 'Resistance Bands' },
        { id: 'kettlebell', label: 'Kettlebell' }
    ];

    const muscleOptions = [
        'chest', 'back', 'shoulders', 'biceps', 'triceps',
        'abs', 'glutes', 'quads', 'hamstrings', 'calves'
    ];

    const fitnessLevels = [
        { id: 'beginner', label: '🌱 Beginner' },
        { id: 'intermediate', label: '🌿 Intermediate' },
        { id: 'advanced', label: '🌳 Advanced' }
    ];

    const toggleArrayItem = (array, item) => {
        return array.includes(item)
            ? array.filter(i => i !== item)
            : [...array, item];
    };

    const handleGenerateWorkout = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/workout/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences)
            });

            if (!response.ok) throw new Error('Failed to generate workout');

            const workout = await response.json();
            setGeneratedWorkout(workout);
        } catch (error) {
            console.error('Error generating workout:', error);
            alert('Failed to generate workout. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartWorkout = () => {
        if (generatedWorkout) {
            // Save to history
            const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            history.push({
                ...generatedWorkout,
                startedAt: new Date().toISOString()
            });
            localStorage.setItem('workoutHistory', JSON.stringify(history));

            onStartWorkout(generatedWorkout);
            navigate('/workout-player');
        }
    };

    return (
        <div className="page slide-up">
            <header className="page-header">
                <h1 className="page-title">FitForge</h1>
                <p className="page-subtitle">Your AI-Powered Workout Generator</p>
            </header>

            {!generatedWorkout ? (
                <>
                    {/* Goals */}
                    <div className="card">
                        <h3 className="card-title">🎯 Your Goals</h3>
                        <div className="chip-group">
                            {goalOptions.map(goal => (
                                <button
                                    key={goal.id}
                                    className={`chip ${preferences.goals.includes(goal.id) ? 'active' : ''}`}
                                    onClick={() => setPreferences(p => ({
                                        ...p,
                                        goals: toggleArrayItem(p.goals, goal.id)
                                    }))}
                                >
                                    {goal.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="card">
                        <h3 className="card-title">⏱️ Workout Duration</h3>
                        <div className="chip-group">
                            {durationOptions.map(mins => (
                                <button
                                    key={mins}
                                    className={`chip ${preferences.duration === mins ? 'active' : ''}`}
                                    onClick={() => setPreferences(p => ({ ...p, duration: mins }))}
                                >
                                    {mins} min
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Equipment */}
                    <div className="card">
                        <h3 className="card-title">🏠 Available Equipment</h3>
                        <div className="chip-group">
                            {equipmentOptions.map(equip => (
                                <button
                                    key={equip.id}
                                    className={`chip ${preferences.equipment.includes(equip.id) ? 'active' : ''}`}
                                    onClick={() => setPreferences(p => ({
                                        ...p,
                                        equipment: toggleArrayItem(p.equipment, equip.id)
                                    }))}
                                >
                                    {equip.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Target Muscles */}
                    <div className="card">
                        <h3 className="card-title">🎯 Target Muscles (Optional)</h3>
                        <div className="chip-group">
                            {muscleOptions.map(muscle => (
                                <button
                                    key={muscle}
                                    className={`chip ${preferences.targetMuscles.includes(muscle) ? 'active' : ''}`}
                                    onClick={() => setPreferences(p => ({
                                        ...p,
                                        targetMuscles: toggleArrayItem(p.targetMuscles, muscle)
                                    }))}
                                >
                                    {muscle}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fitness Level */}
                    <div className="card">
                        <h3 className="card-title">📈 Fitness Level</h3>
                        <div className="chip-group">
                            {fitnessLevels.map(level => (
                                <button
                                    key={level.id}
                                    className={`chip ${preferences.fitnessLevel === level.id ? 'active' : ''}`}
                                    onClick={() => setPreferences(p => ({ ...p, fitnessLevel: level.id }))}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        className="btn btn-primary btn-block btn-lg"
                        onClick={handleGenerateWorkout}
                        disabled={loading || preferences.equipment.length === 0}
                    >
                        {loading ? (
                            <>
                                <span className="spinner" style={{ width: 20, height: 20 }}></span>
                                Generating...
                            </>
                        ) : (
                            <>✨ Generate Workout</>
                        )}
                    </button>
                </>
            ) : (
                /* Generated Workout Preview */
                <div className="fade-in">
                    <div className="card" style={{ background: 'var(--accent-gradient)', border: 'none' }}>
                        <h2 style={{ fontSize: 24, marginBottom: 8 }}>{generatedWorkout.name}</h2>
                        <p style={{ opacity: 0.9 }}>{generatedWorkout.description}</p>
                    </div>

                    {/* Warmup */}
                    {generatedWorkout.warmup?.length > 0 && (
                        <div className="card">
                            <h3 className="card-title">🔥 Warm-up</h3>
                            {generatedWorkout.warmup.map((exercise, i) => (
                                <div key={i} className="settings-item">
                                    <span>{exercise.name}</span>
                                    <span className="text-secondary">{exercise.duration}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Main Workout */}
                    <div className="card">
                        <h3 className="card-title">💪 Main Workout</h3>
                        {generatedWorkout.main?.map((exercise, i) => (
                            <div key={i} className="settings-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <span className="capitalize font-bold">{exercise.name}</span>
                                    {exercise.target && (
                                        <span className="exercise-tag primary">{exercise.target}</span>
                                    )}
                                </div>
                                <div className="text-secondary" style={{ fontSize: 14 }}>
                                    {exercise.sets} sets × {exercise.reps} • Rest: {exercise.rest}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Cooldown */}
                    {generatedWorkout.cooldown?.length > 0 && (
                        <div className="card">
                            <h3 className="card-title">❄️ Cool-down</h3>
                            {generatedWorkout.cooldown.map((exercise, i) => (
                                <div key={i} className="settings-item">
                                    <span>{exercise.name}</span>
                                    <span className="text-secondary">{exercise.duration}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tips */}
                    {generatedWorkout.tips?.length > 0 && (
                        <div className="card">
                            <h3 className="card-title">💡 Tips</h3>
                            <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)' }}>
                                {generatedWorkout.tips.map((tip, i) => (
                                    <li key={i} style={{ marginBottom: 8 }}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setGeneratedWorkout(null)}
                            style={{ flex: 1 }}
                        >
                            ← Modify
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleStartWorkout}
                            style={{ flex: 2 }}
                        >
                            🚀 Start Workout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WorkoutGenerator;
