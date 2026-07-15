const movieForm = document.getElementById('movieForm');
const movieList = document.getElementById('movieList');
const summary = document.getElementById('summary');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');

const inputs = {
  id: document.getElementById('movieId'),
  title: document.getElementById('title'),
  genre: document.getElementById('genre'),
  year: document.getElementById('year'),
  rating: document.getElementById('rating'),
  runtime: document.getElementById('runtime'),
  status: document.getElementById('status')
};

let movies = [];

function renderMovies() {
  movieList.innerHTML = '';
  summary.textContent = `${movies.length} movie${movies.length === 1 ? '' : 's'}`;

  if (!movies.length) {
    movieList.innerHTML = '<tr><td colspan="6" class="empty-state">No movies yet. Add your first one.</td></tr>';
    return;
  }

  movies.forEach((movie) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${movie.title}</td>
      <td>${movie.genre}</td>
      <td>${movie.year}</td>
      <td>${movie.rating || 'N/A'}</td>
      <td>${movie.status}</td>
      <td>
        <button class="small-btn edit" data-id="${movie.id}">Edit</button>
        <button class="small-btn delete" data-id="${movie.id}">Delete</button>
      </td>
    `;
    movieList.appendChild(row);
  });
}

async function fetchMovies() {
  const response = await fetch('/api/movies');
  movies = await response.json();
  renderMovies();
}

async function saveMovie(event) {
  event.preventDefault();

  const payload = {
    title: inputs.title.value.trim(),
    genre: inputs.genre.value.trim(),
    year: Number(inputs.year.value),
    rating: Number(inputs.rating.value || 0),
    runtime: Number(inputs.runtime.value || 0),
    status: inputs.status.value
  };

  const method = inputs.id.value ? 'PUT' : 'POST';
  const url = inputs.id.value ? `/api/movies/${inputs.id.value}` : '/api/movies';

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    alert(error.message || 'Unable to save movie.');
    return;
  }

  movieForm.reset();
  resetForm();
  fetchMovies();
}

function resetForm() {
  inputs.id.value = '';
  formTitle.textContent = 'Add Movie';
  submitBtn.textContent = 'Save Movie';
  cancelBtn.classList.add('hidden');
}

function populateForm(movie) {
  inputs.id.value = movie.id;
  inputs.title.value = movie.title;
  inputs.genre.value = movie.genre;
  inputs.year.value = movie.year;
  inputs.rating.value = movie.rating;
  inputs.runtime.value = movie.runtime;
  inputs.status.value = movie.status;

  formTitle.textContent = 'Edit Movie';
  submitBtn.textContent = 'Update Movie';
  cancelBtn.classList.remove('hidden');
}

movieForm.addEventListener('submit', saveMovie);

movieList.addEventListener('click', async (event) => {
  const target = event.target;
  const movieId = Number(target.dataset.id);

  if (!movieId) {
    return;
  }

  const selectedMovie = movies.find((movie) => movie.id === movieId);

  if (!selectedMovie) {
    return;
  }

  if (target.classList.contains('edit')) {
    populateForm(selectedMovie);
  }

  if (target.classList.contains('delete')) {
    const confirmed = window.confirm(`Delete ${selectedMovie.title}?`);

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/movies/${movieId}`, { method: 'DELETE' });
    if (response.ok) {
      fetchMovies();
    }
  }
});

cancelBtn.addEventListener('click', resetForm);

resetForm();
fetchMovies();
