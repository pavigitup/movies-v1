const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initialDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, (request, response) => {
      console.log("Server Running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initialDBAndServer();

//Returns a list of all movie names in the movie table
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT *
    FROM movie
    ORDER BY movie_id;
    `;
  const allMovies = await db.all(getMoviesQuery);
  const ans = (allMovies) => {
    return {
      movieName: allMovies.movie_name,
    };
  };
  response.send(allMovies.map((each) => ans(each)));
});

//Creates a new movie in the movie table. `movie_id` is auto-incremented
app.post("/movies/", async (request, response) => {
  const moviesList = request.body;
  const { directorId, movieName, leadActor } = moviesList;
  const createMovie = `
    INSERT INTO movie(
        director_id,
        movie_name,
        lead_actor)
    VALUES (
         ${directorId},
        '${movieName}',
        '${leadActor}'
    )
    `;
  await db.run(createMovie);
  response.send("Movie Successfully Added");
});

//Returns a movie based on the movie ID
app.get("/movies/:movieId/", async (request, response) => {
  const movieId = request.params.movieId;
  const getMovieQuery = `
    SELECT *
    FROM movie
    WHERE movie_id = ${movieId};
    `;
  const movie = await db.get(getMovieQuery);
  const ans = (movie) => {
    return {
      movieId: movie.movie_id,
      directorId: movie.director_id,
      movieName: movie.movie_name,
      leadActor: movie.lead_actor,
    };
  };
  response.send(ans(movie));
});

//Updates the details of a movie in the movie table based on the movie ID
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const moviesList = request.body;
  const { directorId, movieName, leadActor } = moviesList;
  const updateMovie = `
    UPDATE movie
    SET
    director_id = ${directorId},
    movie_name = '${movieName}',
    lead_actor = '${leadActor}'
    `;
  await db.run(updateMovie);
  response.send("Movie Details Updated");
});

//Deletes a movie from the movie table based on the movie ID
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovie = `
    DELETE FROM movie
    WHERE movie_id = ${movieId};
    `;
  await db.run(deleteMovie);
  response.send("Movie Removed");
});

//Returns a list of all directors in the director table
app.get("/directors/", async (request, response) => {
  const getDirectorQuery = `
    SELECT *
    FROM director
    ORDER BY director_id;
    `;
  const allDirectors = await db.all(getDirectorQuery);
  const answer = (allDirectors) => {
    return {
      directorId: allDirectors.director_id,
      directorName: allDirectors.director_name,
    };
  };
  response.send(allDirectors.map((each) => answer(each)));
});

//Returns a list of all movie names directed by a specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMoviesQuery = `
   SELECT movie_name
     FROM movie 
     GROUP BY director_id = ${directorId};
`;

  const movies = await db.all(getMoviesQuery);

  const ans = (movies) => {
    return {
      movieName: movies.movie_name,
    };
  };
  response.send(movies.map((each) => ans(each)));
});

module.exports = app;
