import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function WorkoutPlayer({ workout, onComplete }) {
    const navigate = useNavigate();
    const [currentPhase, setCurrentPhase] = useState('warmup'); // warmup, main, cooldown, complete
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [isResting, setIsResting] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const timerRef = useRef(null);

    const getCurrentExercises = () => {
        switch (currentPhase) {
            case 'warmup': return workout?.warmup || [];
            case 'main': return workout?.main || [];
            case 'cooldown': return workout?.cooldown || [];
            default: return [];
        }
    };

    const currentExercises = getCurrentExercises();
    const currentExercise = currentExercises[currentExerciseIndex];
    const totalExercises = (workout?.warmup?.length || 0) +
        (workout?.main?.length || 0) +
        (workout?.cooldown?.length || 0);

    const getCompletedCount = () => {
        let count = 0;
        if (currentPhase === 'main') count += workout?.warmup?.length || 0;
        if (currentPhase === 'cooldown') count += (workout?.warmup?.length || 0) + (workout?.main?.length || 0);
        return count + currentExerciseIndex;
    };

    const progress = totalExercises > 0 ? (getCompletedCount() / totalExercises) * 100 : 0;

    // Timer logic
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isRunning]);

    // Start timer on mount
    useEffect(() => {
        if (workout) {
            setIsRunning(true);
        }
    }, [workout]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getRestTime = () => {
        if (!currentExercise?.rest) return 60;
        const match = currentExercise.rest.match(/(\d+)/);
        return match ? parseInt(match[1]) : 60;
    };

    const nextExercise = () => {
        setIsResting(false);

        // Check if we need to advance sets (for main workout)
        if (currentPhase === 'main' && currentExercise?.sets) {
            const totalSets = parseInt(currentExercise.sets) || 1;
            if (currentSet < totalSets) {
                setCurrentSet(s => s + 1);
                setIsResting(true);
                return;
            }
        }

        // Move to next exercise
        setCurrentSet(1);
        if (currentExerciseIndex < currentExercises.length - 1) {
            setCurrentExerciseIndex(i => i + 1);
        } else {
            // Move to next phase
            if (currentPhase === 'warmup' && workout?.main?.length > 0) {
                setCurrentPhase('main');
                setCurrentExerciseIndex(0);
            } else if (currentPhase === 'main' && workout?.cooldown?.length > 0) {
                setCurrentPhase('cooldown');
                setCurrentExerciseIndex(0);
            } else {
                completeWorkout();
            }
        }
    };

    const previousExercise = () => {
        if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex(i => i - 1);
            setCurrentSet(1);
            setIsResting(false);
        } else if (currentPhase === 'main' && workout?.warmup?.length > 0) {
            setCurrentPhase('warmup');
            setCurrentExerciseIndex((workout?.warmup?.length || 1) - 1);
        } else if (currentPhase === 'cooldown' && workout?.main?.length > 0) {
            setCurrentPhase('main');
            setCurrentExerciseIndex((workout?.main?.length || 1) - 1);
        }
    };

    const completeWorkout = () => {
        setIsRunning(false);
        setCurrentPhase('complete');

        // Save workout to history
        const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
        const workoutRecord = {
            ...workout,
            completedAt: new Date().toISOString(),
            duration: timer
        };

        // Update last entry if it's the same workout
        if (history.length > 0 && history[history.length - 1].startedAt) {
            history[history.length - 1] = workoutRecord;
        } else {
            history.push(workoutRecord);
        }

        localStorage.setItem('workoutHistory', JSON.stringify(history));

        // Update streak
        const today = new Date().toDateString();
        const streakData = JSON.parse(localStorage.getItem('streakData') || '{}');
        if (!streakData.workoutDays) streakData.workoutDays = [];
        if (!streakData.workoutDays.includes(today)) {
            streakData.workoutDays.push(today);
        }
        localStorage.setItem('streakData', JSON.stringify(streakData));
    };

    const handleFinish = () => {
        onComplete();
        navigate('/progress');
    };

    const handleQuit = () => {
        if (confirm('Are you sure you want to quit this workout?')) {
            onComplete();
            navigate('/');
        }
    };

    if (!workout) {
        return (
            <div className="workout-player flex-center" style={{ textAlign: 'center' }}>
                <div>
                    <h2>No workout loaded</h2>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                        Generate Workout
                    </button>
                </div>
            </div>
        );
    }

    if (currentPhase === 'complete') {
        return (
            <div className="workout-player flex-center" style={{ textAlign: 'center' }}>
                <div className="slide-up">
                    <div style={{ fontSize: 80, marginBottom: 24 }}>🎉</div>
                    <h1 style={{ fontSize: 32, marginBottom: 8 }}>Workout Complete!</h1>
                    <p className="text-secondary" style={{ marginBottom: 32 }}>
                        Great job! You worked out for {formatTime(timer)}
                    </p>

                    <div className="stats-grid" style={{ marginBottom: 32, maxWidth: 300 }}>
                        <div className="stat-card">
                            <div className="stat-value">{formatTime(timer)}</div>
                            <div className="stat-label">Duration</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{totalExercises}</div>
                            <div className="stat-label">Exercises</div>
                        </div>
                    </div>

                    <button className="btn btn-primary btn-lg" onClick={handleFinish}>
                        View Progress →
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="workout-player">
            {/* Header */}
            <div className="workout-header">
                <button className="btn btn-secondary btn-sm" onClick={handleQuit}>
                    ✕ Quit
                </button>
                <div style={{ textAlign: 'center' }}>
                    <div className="text-secondary" style={{ fontSize: 12, textTransform: 'uppercase' }}>
                        {currentPhase}
                    </div>
                    <div className="font-bold">{formatTime(timer)}</div>
                </div>
                <div style={{ width: 70 }}></div>
            </div>

            {/* Progress Bar */}
            <div className="workout-progress">
                <div className="workout-progress-bar" style={{ width: `${progress}%` }}></div>
            </div>

            {/* Current Exercise */}
            <div className="current-exercise">
                {isResting ? (
                    <>
                        <div style={{ fontSize: 48, marginBottom: 24 }}>😌</div>
                        <h2 style={{ marginBottom: 8 }}>Rest Time</h2>
                        <p className="text-secondary" style={{ marginBottom: 24 }}>
                            Next: Set {currentSet} of {currentExercise?.sets || 1}
                        </p>
                        <div className="timer-display">{getRestTime()}s</div>
                        <div className="timer-label">Rest between sets</div>
                    </>
                ) : (
                    <>
                        {currentExercise?.gifUrl ? (
                            <img
                                src={currentExercise.gifUrl}
                                alt={currentExercise.name}
                                className="current-exercise-gif"
                            />
                        ) : (
                            <div
                                className="current-exercise-gif flex-center"
                                style={{ background: 'var(--bg-secondary)', fontSize: 64 }}
                            >
                                🏋️
                            </div>
                        )}

                        <h2 className="current-exercise-name">{currentExercise?.name}</h2>

                        {currentExercise?.target && (
                            <div className="current-exercise-target">{currentExercise.target}</div>
                        )}

                        {currentPhase === 'main' && currentExercise?.sets && (
                            <div className="timer-display">
                                Set {currentSet}/{currentExercise.sets}
                            </div>
                        )}

                        <div className="timer-label">
                            {currentExercise?.reps || currentExercise?.duration || 'Complete the exercise'}
                        </div>
                    </>
                )}
            </div>

            {/* Controls */}
            <div className="workout-controls">
                <button
                    className="btn btn-secondary"
                    onClick={previousExercise}
                    disabled={currentExerciseIndex === 0 && currentPhase === 'warmup'}
                >
                    ⏮️ Prev
                </button>

                <button
                    className="btn btn-primary btn-lg"
                    onClick={nextExercise}
                    style={{ minWidth: 140 }}
                >
                    {isResting ? 'Skip Rest' : 'Done ✓'}
                </button>

                <button
                    className="btn btn-secondary"
                    onClick={nextExercise}
                >
                    Skip ⏭️
                </button>
            </div>

            {/* Next Exercise Preview */}
            {currentExerciseIndex < currentExercises.length - 1 && (
                <div style={{
                    textAlign: 'center',
                    marginTop: 24,
                    padding: 16,
                    background: 'var(--bg-secondary)',
                    borderRadius: 12
                }}>
                    <span className="text-muted">Up next: </span>
                    <span className="capitalize">{currentExercises[currentExerciseIndex + 1]?.name}</span>
                </div>
            )}
        </div>
    );
}

export default WorkoutPlayer;
