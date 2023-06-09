const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Sever Running at http://localhost:3000/ ");
    });
  } catch (e) {
    console.log("DB Error:${e.message}");
    process.exit(1);
  }
};

initializeDBAndServer();
module.exports = app;

const converDBToResponse = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertmatchDBtoResponse = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
//GET PLAYERS API 1

app.get("/players/", async (request, response) => {
  const playersQuery = `
    SELECT *
    FROM player_details;
    `;
  const playerArray = await db.all(playersQuery);
  response.send(playerArray.map((each) => converDBToResponse(each)));
});

//GET PLAYERID API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};
    `;

  const playerArray = await db.get(playerQuery);
  response.send(converDBToResponse(playerArray));
});

//PUT PLAYERID API3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatequery = `
    UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id =${playerId};
    `;

  const updatedplayer = await db.run(updatequery);
  response.send("Player Details Updated");
});

//GET MATCCHE ID API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};
    `;
  const matchArray = await db.get(matchQuery);
  response.send(convertmatchDBtoResponse(matchArray));
});

//GET PLAYER AND MATCHES API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getplayermatchquery = `
    SELECT *
    FROM player_match_score NATURAL JOIN match_details
    WHERE player_id = ${playerId};
    `;

  const matchdetail = await db.all(getplayermatchquery);
  response.send(matchdetail.map((each) => convertmatchDBtoResponse(each)));
});

//GET MATCHES API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playersQuery = `
    SELECT *
    FROM player_match_score NATURAL JOIN player_details
    WHERE match_id = ${matchId};
    `;

  const players = await db.all(playersQuery);
  response.send(players.map((each) => converDBToResponse(each)));
});

//GET API7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `
   SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};;
    `;

  const stats = await db.all(query);
  response.send(stats);
});
