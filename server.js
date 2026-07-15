const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const moviesFilePath = path.join(__dirname, 'models', 'movies.json');
const publicDir = path.join(__dirname, 'public');

app.use(express.json());
app.use(express.static(publicDir));

function seedMovies() {
  return [
    { id: 1, title: 'Inception', genre: 'Sci-Fi', year: 2010, rating: 8.8, runtime: 148, status: 'Watching' },
    { id: 2, title: 'The Dark Knight', genre: 'Action', year: 2008, rating: 9.0, runtime: 152, status: 'Completed' },
    { id: 3, title: 'Interstellar', genre: 'Drama', year: 2014, rating: 8.7, runtime: 169, status: 'Plan to Watch' }
  ];
}

function loadMovies() {
  if (!fs.existsSync(moviesFilePath)) {
    fs.mkdirSync(path.dirname(moviesFilePath), { recursive: true });
    fs.writeFileSync(moviesFilePath, JSON.stringify(seedMovies(), null, 2));
  }

  const fileContents = fs.readFileSync(moviesFilePath, 'utf8');
  const parsedMovies = JSON.parse(fileContents);
  return Array.isArray(parsedMovies) ? parsedMovies : [];
}

function saveMovies(movies) {
  fs.writeFileSync(moviesFilePath, JSON.stringify(movies, null, 2));
}

let movies = loadMovies();

function getNextId() {
  return movies.length ? Math.max(...movies.map((movie) => movie.id)) + 1 : 1;
}

app.get('/api/movies', (req, res) => {
  res.json(movies);
});

app.post('/api/movies', (req, res) => {
  const { title, genre, year, rating, runtime, status } = req.body;

  if (!title || !genre || !year) {
    return res.status(400).json({ message: 'Title, genre, and year are required.' });
  }

  const newMovie = {
    id: getNextId(),
    title,
    genre,
    year: Number(year),
    rating: Number(rating || 0),
    runtime: Number(runtime || 0),
    status: status || 'Plan to Watch'
  };

  movies.push(newMovie);
  saveMovies(movies);
  res.status(201).json(newMovie);
});

app.put('/api/movies/:id', (req, res) => {
  const movieId = Number(req.params.id);
  const movieIndex = movies.findIndex((movie) => movie.id === movieId);

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found.' });
  }

  const updatedMovie = {
    ...movies[movieIndex],
    ...req.body,
    id: movieId,
    year: Number(req.body.year || movies[movieIndex].year),
    rating: Number(req.body.rating || movies[movieIndex].rating),
    runtime: Number(req.body.runtime || movies[movieIndex].runtime)
  };

  movies[movieIndex] = updatedMovie;
  saveMovies(movies);
  res.json(updatedMovie);
});

app.delete('/api/movies/:id', (req, res) => {
  const movieId = Number(req.params.id);
  const originalLength = movies.length;
  movies = movies.filter((movie) => movie.id !== movieId);

  if (movies.length === originalLength) {
    return res.status(404).json({ message: 'Movie not found.' });
  }

  saveMovies(movies);
  res.json({ message: 'Movie deleted successfully.' });
});

app.listen(PORT, () => {
  console.log(`Movie management system running on http://localhost:${PORT}`);
});