import { useState, useEffect } from 'react';

function ExerciseLibrary() {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBodyPart, setSelectedBodyPart] = useState('all');
    const [selectedEquipment, setSelectedEquipment] = useState('all');
    const [bodyParts, setBodyParts] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState(null);

    // Fetch filter options
    useEffect(() => {
        Promise.all([
            fetch('/api/bodyPartList').then(r => r.json()),
            fetch('/api/equipmentList').then(r => r.json())
        ]).then(([bodyPartsData, equipmentData]) => {
            setBodyParts(['all', ...bodyPartsData]);
            setEquipment(['all', ...equipmentData]);
        }).catch(console.error);
    }, []);

    // Fetch exercises based on filters
    useEffect(() => {
        const fetchExercises = async () => {
            setLoading(true);
            try {
                let url = '/api/exercises/equipment/body%20weight?limit=50';

                if (selectedBodyPart !== 'all') {
                    url = `/api/exercises/bodyPart/${encodeURIComponent(selectedBodyPart)}?limit=50`;
                } else if (selectedEquipment !== 'all') {
                    url = `/api/exercises/equipment/${encodeURIComponent(selectedEquipment)}?limit=50`;
                }

                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch');

                const data = await response.json();
                setExercises(data);
            } catch (error) {
                console.error('Error fetching exercises:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExercises();
    }, [selectedBodyPart, selectedEquipment]);

    // Search exercises
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/exercises/name/${encodeURIComponent(searchQuery)}?limit=30`);
            if (!response.ok) throw new Error('Failed to search');

            const data = await response.json();
            setExercises(data);
        } catch (error) {
            console.error('Error searching exercises:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredExercises = exercises.filter(ex => {
        if (searchQuery && !ex.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        return true;
    });

    return (
        <div className="page">
            <header className="page-header">
                <h1 className="page-title">Exercise Library</h1>
                <p className="page-subtitle">1,300+ exercises with animated guides</p>
            </header>

            {/* Search */}
            <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search exercises..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
            </div>

            {/* Filters */}
            <div className="filter-section">
                <span className="filter-label">Body Part</span>
                <div className="filter-scroll">
                    {bodyParts.map(part => (
                        <button
                            key={part}
                            className={`chip ${selectedBodyPart === part ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedBodyPart(part);
                                setSelectedEquipment('all');
                            }}
                        >
                            {part === 'all' ? '🔷 All' : part}
                        </button>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <span className="filter-label">Equipment</span>
                <div className="filter-scroll">
                    {equipment.map(equip => (
                        <button
                            key={equip}
                            className={`chip ${selectedEquipment === equip ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedEquipment(equip);
                                setSelectedBodyPart('all');
                            }}
                        >
                            {equip === 'all' ? '🔷 All' : equip}
                        </button>
                    ))}
                </div>
            </div>

            {/* Exercise Grid */}
            {loading ? (
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            ) : filteredExercises.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <h3 className="empty-state-title">No exercises found</h3>
                    <p>Try adjusting your filters or search term</p>
                </div>
            ) : (
                <div className="exercise-grid">
                    {filteredExercises.map(exercise => (
                        <div
                            key={exercise.id}
                            className="exercise-card"
                            onClick={() => setSelectedExercise(exercise)}
                        >
                            <img
                                src={exercise.gifUrl}
                                alt={exercise.name}
                                className="exercise-gif"
                                loading="lazy"
                            />
                            <div className="exercise-info">
                                <h4 className="exercise-name">{exercise.name}</h4>
                                <div className="exercise-meta">
                                    <span className="exercise-tag primary">{exercise.target}</span>
                                    <span className="exercise-tag">{exercise.equipment}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Exercise Detail Modal */}
            {selectedExercise && (
                <div
                    className="modal-overlay"
                    onClick={() => setSelectedExercise(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.9)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20
                    }}
                >
                    <div
                        className="modal-content slide-up"
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: 20,
                            maxWidth: 400,
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }}
                    >
                        <img
                            src={selectedExercise.gifUrl}
                            alt={selectedExercise.name}
                            style={{ width: '100%', borderRadius: '20px 20px 0 0' }}
                        />
                        <div style={{ padding: 20 }}>
                            <h2 className="capitalize" style={{ marginBottom: 12 }}>
                                {selectedExercise.name}
                            </h2>

                            <div className="exercise-meta" style={{ marginBottom: 16 }}>
                                <span className="exercise-tag primary">{selectedExercise.target}</span>
                                <span className="exercise-tag">{selectedExercise.bodyPart}</span>
                                <span className="exercise-tag">{selectedExercise.equipment}</span>
                            </div>

                            {selectedExercise.secondaryMuscles?.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <h4 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                        Secondary Muscles
                                    </h4>
                                    <div className="chip-group">
                                        {selectedExercise.secondaryMuscles.map(muscle => (
                                            <span key={muscle} className="exercise-tag">{muscle}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedExercise.instructions?.length > 0 && (
                                <div>
                                    <h4 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                        Instructions
                                    </h4>
                                    <ol style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 14 }}>
                                        {selectedExercise.instructions.map((step, i) => (
                                            <li key={i} style={{ marginBottom: 8 }}>{step}</li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            <button
                                className="btn btn-secondary btn-block"
                                onClick={() => setSelectedExercise(null)}
                                style={{ marginTop: 20 }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExerciseLibrary;
