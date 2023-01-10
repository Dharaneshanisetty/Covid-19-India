const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//1

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state
    ORDER BY
      state_id;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => ({
      stateId: eachState.state_id,
      stateName: eachState.state_name,
      population: eachState.population,
    }))
  );
});

//2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT 
          *
        FROM
         state
        WHERE
           state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertStateDbObjectToResponseObject(state));
});

///3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `
        INSERT INTO 
          district (district_name,state_id,cases,cured,active,deaths)
          VALUES
            (
                ${districtName},
                ${stateId},
                '${cases}',
                '${cured}',
                '${active}',
                '${deaths}'
            );`;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT 
          *
        FROM
         district
        WHERE
           district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(district);
});

//7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
        SELECT 
          SUM(cases),
          SUM(cured),
          SUM(active),
          SUM(deaths)
        FROM 
         district
        WHERE 
          state_id = ${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  console.log(stats);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictStateQuery = `
    SELECT
     *
    FROM
     district
    WHERE
      district_id = ${districtId};`;
  const DistrictStateArray = await db.all(getDistrictStateQuery);
  response.send(DistrictStateArray);
});

module.exports = app;

//6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
        UPDATE
         district 
        SET 
          district_name = '${districtName}',
          state_id = '${stateId}',
          cases = '${cases}',
          cured = '${cured}',
          active = '${active}',
          deaths = '${deaths}',
        WHERE
          district_id = '${districtId}';`;

  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM 
         district
        WHERE 
         district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});
