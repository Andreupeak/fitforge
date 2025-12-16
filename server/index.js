import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Check if dist folder exists
const distPath = join(__dirname, '../dist');
console.log('Looking for dist at:', distPath);
console.log('Dist folder exists:', existsSync(distPath));

// Serve static files from the built frontend
if (existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  console.warn('Warning: dist folder not found. Run npm run build first.');
}

// API Keys - trim to remove any accidental whitespace/newlines
const RAPIDAPI_KEY = (process.env.RAPIDAPI_KEY || '').trim();
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || '').trim();
const EXERCISEDB_HOST = 'exercisedb.p.rapidapi.com';

// Log API key status at startup (without revealing the actual keys)
console.log('RAPIDAPI_KEY configured:', !!RAPIDAPI_KEY, RAPIDAPI_KEY ? `(${RAPIDAPI_KEY.length} chars)` : '(missing)');
console.log('OPENAI_API_KEY configured:', !!OPENAI_API_KEY, OPENAI_API_KEY ? `(${OPENAI_API_KEY.length} chars)` : '(missing)');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    rapidApiKey: RAPIDAPI_KEY ? `configured (${RAPIDAPI_KEY.length} chars)` : 'MISSING',
    openAiKey: OPENAI_API_KEY ? `configured (${OPENAI_API_KEY.length} chars)` : 'MISSING',
    exerciseDbHost: EXERCISEDB_HOST
  });
});

// Cache for exercise data (reduces API calls)
const cache = {
  exercises: null,
  bodyParts: null,
  equipment: null,
  targets: null,
  lastFetch: null,
  CACHE_DURATION: 1000 * 60 * 60 // 1 hour
};

// Helper function to fetch from ExerciseDB
async function fetchFromExerciseDB(endpoint) {
  const url = `https://${EXERCISEDB_HOST}${endpoint}`;
  console.log('Fetching from ExerciseDB:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': EXERCISEDB_HOST
      }
    });

    console.log('ExerciseDB response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ExerciseDB API error response:', errorText);
      throw new Error(`ExerciseDB API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error('ExerciseDB fetch error:', error.message);
    throw error;
  }
}

// Helper function to add GIF URLs to exercises
// Uses our server as a proxy to add authentication
function addGifUrls(exercises) {
  if (!Array.isArray(exercises)) return exercises;

  return exercises.map(exercise => ({
    ...exercise,
    gifUrl: `/api/image/${exercise.id}`
  }));
}

// Image proxy - fetches GIFs from ExerciseDB with authentication
// Endpoint: /image?exerciseId={id}&resolution={res}
app.get('/api/image/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resolution = req.query.res || 360; // Default to 360p

    const imageUrl = `https://${EXERCISEDB_HOST}/image?exerciseId=${id}&resolution=${resolution}`;
    console.log('Fetching image:', imageUrl);

    const response = await fetch(imageUrl, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': EXERCISEDB_HOST
      }
    });

    if (!response.ok) {
      console.error('Image fetch failed:', response.status, await response.text());
      return res.status(404).send('Image not found');
    }

    // Get content type and pipe the image
    const contentType = response.headers.get('content-type') || 'image/gif';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    // Stream the response to client
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).send('Failed to fetch image');
  }
});

// ===== EXERCISE ROUTES =====

// Get all body parts
app.get('/api/bodyPartList', async (req, res) => {
  try {
    if (cache.bodyParts && Date.now() - cache.lastFetch < cache.CACHE_DURATION) {
      return res.json(cache.bodyParts);
    }

    const data = await fetchFromExerciseDB('/exercises/bodyPartList');
    cache.bodyParts = data;
    cache.lastFetch = Date.now();
    res.json(data);
  } catch (error) {
    console.error('Error fetching body parts:', error);
    res.status(500).json({ error: 'Failed to fetch body parts' });
  }
});

// Get all equipment types
app.get('/api/equipmentList', async (req, res) => {
  try {
    if (cache.equipment && Date.now() - cache.lastFetch < cache.CACHE_DURATION) {
      return res.json(cache.equipment);
    }

    const data = await fetchFromExerciseDB('/exercises/equipmentList');
    cache.equipment = data;
    cache.lastFetch = Date.now();
    res.json(data);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment list' });
  }
});

// Get all target muscles
app.get('/api/targetList', async (req, res) => {
  try {
    if (cache.targets && Date.now() - cache.lastFetch < cache.CACHE_DURATION) {
      return res.json(cache.targets);
    }

    const data = await fetchFromExerciseDB('/exercises/targetList');
    cache.targets = data;
    cache.lastFetch = Date.now();
    res.json(data);
  } catch (error) {
    console.error('Error fetching targets:', error);
    res.status(500).json({ error: 'Failed to fetch target list' });
  }
});

// Get exercises by body part
app.get('/api/exercises/bodyPart/:bodyPart', async (req, res) => {
  try {
    const { bodyPart } = req.params;
    const limit = req.query.limit || 50;
    const data = await fetchFromExerciseDB(`/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=${limit}`);
    res.json(addGifUrls(data));
  } catch (error) {
    console.error('Error fetching exercises by body part:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// Get exercises by equipment
app.get('/api/exercises/equipment/:equipment', async (req, res) => {
  try {
    const { equipment } = req.params;
    const limit = req.query.limit || 50;
    const data = await fetchFromExerciseDB(`/exercises/equipment/${encodeURIComponent(equipment)}?limit=${limit}`);
    res.json(addGifUrls(data));
  } catch (error) {
    console.error('Error fetching exercises by equipment:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// Get exercises by target muscle
app.get('/api/exercises/target/:target', async (req, res) => {
  try {
    const { target } = req.params;
    const limit = req.query.limit || 50;
    const data = await fetchFromExerciseDB(`/exercises/target/${encodeURIComponent(target)}?limit=${limit}`);
    res.json(addGifUrls(data));
  } catch (error) {
    console.error('Error fetching exercises by target:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// Get exercise by ID
app.get('/api/exercises/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromExerciseDB(`/exercises/exercise/${id}`);
    // Add GIF URL using our proxy
    res.json({ ...data, gifUrl: `/api/image/${data.id}` });
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
});

// Search exercises by name
app.get('/api/exercises/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const limit = req.query.limit || 20;
    const data = await fetchFromExerciseDB(`/exercises/name/${encodeURIComponent(name)}?limit=${limit}`);
    res.json(addGifUrls(data));
  } catch (error) {
    console.error('Error searching exercises:', error);
    res.status(500).json({ error: 'Failed to search exercises' });
  }
});

// ===== AI COACH ROUTES =====

// AI Coach Chat
app.post('/api/coach', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    const systemPrompt = `You are FitForge AI Coach, an expert fitness trainer and nutritionist. You help users with:
- Exercise form and technique questions
- Workout modifications for different fitness levels
- Nutrition advice for muscle building and weight gain
- Recovery tips and rest recommendations
- Flexibility and mobility exercises
- Posture improvement exercises
- General fitness and health questions

Be encouraging, practical, and specific in your advice. Keep responses concise but helpful.
When suggesting exercises, mention that users can find them in the Exercise Library with animated demonstrations.
For nutrition, focus on practical meal suggestions for someone trying to gain weight and build muscle.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    res.json({
      response: data.choices[0].message.content,
      usage: data.usage
    });
  } catch (error) {
    console.error('Error with AI coach:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// AI Workout Generator
app.post('/api/workout/generate', async (req, res) => {
  try {
    const {
      goals = ['muscle building'],
      duration = 30,
      equipment = ['body weight'],
      targetMuscles = [],
      fitnessLevel = 'beginner'
    } = req.body;

    // First, fetch some exercises that match the criteria
    let exercises = [];

    // Fetch bodyweight exercises
    for (const equip of equipment) {
      try {
        const data = await fetchFromExerciseDB(`/exercises/equipment/${encodeURIComponent(equip)}?limit=100`);
        exercises = exercises.concat(data);
      } catch (e) {
        console.error(`Error fetching ${equip} exercises:`, e);
      }
    }

    // Ask AI to create a structured workout from available exercises
    const exerciseNames = exercises.slice(0, 50).map(e => `${e.name} (${e.target})`).join(', ');

    const prompt = `Create a ${duration}-minute workout routine for a ${fitnessLevel} with these goals: ${goals.join(', ')}.
    
Available exercises: ${exerciseNames}

${targetMuscles.length ? `Focus on: ${targetMuscles.join(', ')}` : 'Create a balanced full-body workout'}

Return a JSON object with this exact structure:
{
  "name": "workout name",
  "description": "brief description",
  "warmup": [{"name": "exercise", "duration": "30 seconds or reps"}],
  "main": [{"name": "exercise", "sets": 3, "reps": "8-12", "rest": "60 seconds"}],
  "cooldown": [{"name": "stretch", "duration": "30 seconds"}],
  "tips": ["tip1", "tip2"]
}

Only include exercises from the available list. Keep it appropriate for the fitness level.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional fitness trainer. Return only valid JSON, no markdown.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate workout');
    }

    const data = await response.json();
    let workout;

    try {
      // Parse the AI response as JSON
      const content = data.choices[0].message.content;
      workout = JSON.parse(content.replace(/```json\n?|```\n?/g, ''));
    } catch (e) {
      // If parsing fails, return a default structure
      workout = {
        name: "Quick Bodyweight Workout",
        description: "A simple bodyweight routine",
        warmup: [{ name: "Jumping Jacks", duration: "60 seconds" }],
        main: [
          { name: "Push-ups", sets: 3, reps: "10-15", rest: "60 seconds" },
          { name: "Squats", sets: 3, reps: "15-20", rest: "60 seconds" },
          { name: "Plank", sets: 3, reps: "30 seconds", rest: "30 seconds" }
        ],
        cooldown: [{ name: "Standing Stretch", duration: "60 seconds" }],
        tips: ["Focus on form over speed", "Stay hydrated"]
      };
    }

    // Match workout exercises with full exercise data including GIFs
    const enrichedWorkout = {
      ...workout,
      main: workout.main.map(exercise => {
        const match = exercises.find(e =>
          e.name.toLowerCase().includes(exercise.name.toLowerCase()) ||
          exercise.name.toLowerCase().includes(e.name.toLowerCase())
        );
        return {
          ...exercise,
          gifUrl: match?.gifUrl,
          target: match?.target,
          id: match?.id
        };
      })
    };

    res.json(enrichedWorkout);
  } catch (error) {
    console.error('Error generating workout:', error);
    res.status(500).json({ error: 'Failed to generate workout' });
  }
});

// Calculate recovery time based on workout
app.post('/api/recovery/estimate', async (req, res) => {
  try {
    const { workout, previousWorkouts = [] } = req.body;

    // Simple recovery estimation based on workout intensity
    const musclesWorked = workout.main?.map(e => e.target).filter(Boolean) || [];
    const uniqueMuscles = [...new Set(musclesWorked)];

    // Base recovery time in hours
    let recoveryHours = 24;

    // More muscles = more recovery needed
    recoveryHours += uniqueMuscles.length * 6;

    // Check if same muscles were worked recently
    const last48Hours = previousWorkouts.filter(w => {
      const workoutDate = new Date(w.date);
      const now = new Date();
      return (now - workoutDate) / (1000 * 60 * 60) < 48;
    });

    if (last48Hours.length > 0) {
      recoveryHours += 12; // Need more rest if worked out recently
    }

    res.json({
      estimatedHours: Math.min(recoveryHours, 72),
      musclesWorked: uniqueMuscles,
      recommendation: recoveryHours > 48
        ? "Take a rest day or do light stretching"
        : "You can do a light workout targeting different muscles",
      nextWorkoutDate: new Date(Date.now() + recoveryHours * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error estimating recovery:', error);
    res.status(500).json({ error: 'Failed to estimate recovery' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  const indexPath = join(__dirname, '../dist/index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>FitForge</title></head>
        <body style="background:#0f0f23;color:white;font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <h1>🏋️ FitForge API</h1>
            <p>Server is running! Build the frontend with npm run build.</p>
            <p>API endpoints available at /api/*</p>
          </div>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`🏋️ FitForge server running on port ${PORT}`);
});
