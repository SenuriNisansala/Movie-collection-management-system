const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'movie_management_system';

app.use(express.json());
app.use(express.static(publicDir));

let moviesCollection;

const seedMovies = [
  { id: 1, title: 'Inception', genre: 'Sci-Fi', year: 2010, rating: 8.8, runtime: 148, status: 'Watching' },
  { id: 2, title: 'The Dark Knight', genre: 'Action', year: 2008, rating: 9.0, runtime: 152, status: 'Completed' },
  { id: 3, title: 'Interstellar', genre: 'Drama', year: 2014, rating: 8.7, runtime: 169, status: 'Plan to Watch' }
];

function normalizeMoviePayload(movieData, existingMovie = {}) {
  return {
    ...existingMovie,
    ...movieData,
    title: String(movieData.title ?? existingMovie.title ?? '').trim(),
    genre: String(movieData.genre ?? existingMovie.genre ?? '').trim(),
    year: Number(movieData.year ?? existingMovie.year ?? 0),
    rating: Number(movieData.rating ?? existingMovie.rating ?? 0),
    runtime: Number(movieData.runtime ?? existingMovie.runtime ?? 0),
    status: String(movieData.status ?? existingMovie.status ?? 'Plan to Watch').trim()
  };
}

async function ensureSeedMovies() {
  const count = await moviesCollection.countDocuments();

  if (count === 0) {
    await moviesCollection.insertMany(seedMovies);
  }
}

async function getNextId() {
  const lastMovie = await moviesCollection.find({}).sort({ id: -1 }).limit(1).next();
  return lastMovie ? lastMovie.id + 1 : 1;
}

app.get('/api/movies', async (req, res) => {
  const movies = await moviesCollection.find({}).sort({ id: 1 }).toArray();
  res.json(movies);
});

app.post('/api/movies', async (req, res) => {
  const { title, genre, year, rating, runtime, status } = req.body;

  if (!title || !genre || !year) {
    return res.status(400).json({ message: 'Title, genre, and year are required.' });
  }

  const newMovie = normalizeMoviePayload({
    title,
    genre,
    year,
    rating,
    runtime,
    status
  });

  newMovie.id = await getNextId();

  await moviesCollection.insertOne(newMovie);
  res.status(201).json(newMovie);
});

app.put('/api/movies/:id', async (req, res) => {
  const movieId = Number(req.params.id);
  const existingMovie = await moviesCollection.findOne({ id: movieId });

  if (!existingMovie) {
    return res.status(404).json({ message: 'Movie not found.' });
  }

  const updatedMovie = normalizeMoviePayload(req.body, existingMovie);
  updatedMovie.id = movieId;

  await moviesCollection.updateOne({ id: movieId }, { $set: updatedMovie });
  res.json(updatedMovie);
});

app.delete('/api/movies/:id', async (req, res) => {
  const movieId = Number(req.params.id);
  const result = await moviesCollection.deleteOne({ id: movieId });

  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Movie not found.' });
  }

  res.json({ message: 'Movie deleted successfully.' });
});

async function startServer() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  const db = client.db(DB_NAME);
  moviesCollection = db.collection('movies');
  await ensureSeedMovies();

  app.listen(PORT, () => {
    console.log(`Movie management system running on http://localhost:${PORT}`);
    console.log(`Connected to MongoDB at ${MONGO_URI}/${DB_NAME}`);
  });
}

startServer().catch((error) => {
  console.error('MongoDB connection failed:', error);
  process.exit(1);
});