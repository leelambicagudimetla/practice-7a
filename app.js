const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializationAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server is running at http://localhost:3001 ");
    });
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
};

initializationAndServer();

const converApi = (item) => {
  return {
    playerId: item.playerId,
    playerName: item.playerName,
  };
};
// api 1
app.get("/players/", async (request, response) => {
  const selectQuery = `SELECT player_id AS playerId,player_name AS playerName FROM player_details;`;
  const dbUser = await db.all(selectQuery);
  response.send(dbUser.map((each) => converApi(each)));
});

// api 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const selectQuery = `SELECT player_id AS playerId,player_name AS playerName FROM player_details WHERE player_id=${playerId};`;
  const dbUser = await db.get(selectQuery);
  //console.log(dbUser);
  response.send({
    playerId: dbUser.playerId,
    playerName: dbUser.playerName,
  });
});

// api 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const keepTheQuery = `
    UPDATE player_details SET player_name='${playerName}' WHERE player_id=${playerId};`;
  const dbUserDet = await db.run(keepTheQuery);
  response.send("Player Details Updated");
});

// api 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const selectQuery = `SELECT match_id AS matchId,match,year FROM match_details WHERE match_id='${matchId}';`;
  const dbUser = await db.get(selectQuery);
  response.send(dbUser);
});

const convertMatchDet = (item) => {
  return {
    matchId: item.match_id,
    match: item.match,
    year: item.year,
  };
};
// api 5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const selectQuery = `
  SELECT * FROM player_match_score 
  NATURAL JOIN match_details
  WHERE player_id=${playerId}
  ;`;
  const dbUser = await db.all(selectQuery);
  //console.log(dbUser);
  response.send(dbUser.map((each) => convertMatchDet(each)));
});

//api 6
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const playerDetails = await db.all(getMatchPlayersQuery);
  response.send(playerDetails.map((each) => converApi(each)));
});

//api 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
          player_details.player_name AS playerName,
          SUM(score) AS totalScore,
          SUM(fours) AS totalFours,
          SUM(sixes) AS totalSixes
        FROM player_match_score 
        NATURAL JOIN player_details
        WHERE 
        player_id=${playerId};`;
  const playerDetails = await db.get(getMatchPlayersQuery);
  response.send(playerDetails);
});
module.exports = app;
