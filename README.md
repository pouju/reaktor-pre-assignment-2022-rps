# Rock-Paper-Scissors Result App

The app is implementation for Reaktor Pre Assignment 2022 defined [here](https://www.reaktor.com/assignment-2022-developers/).

The purpose is to show real time Rock-Paper-Scissor (RPS) games and players' history results.

The application utilizes Reaktor's [Bad Api](https://bad-api-assignment.reaktor.com/rps/history) to get history data and live data.

The problem was that app must be fast and doing it only with frontend didn't looked a solution as Bad Api returned paginated data with cursor to next page requiring recursive data fetching page by page. It's too slow and also quite heavy to load all data to frontend when user access the app. So the seconf though was to keep track of cursors in backend (db) and load pages in parellel to frontend from Bad Api as cursors are known. However this was also too slow and heavy. So the third and now implemented solution is to replicate Bad Api to own database and serve only required data from this DB to frontend when required. This makes it also easy to to query required aggregations from Bad Api's data as it's stored to DB. Thus this kind of implementation requires that backend keeps syncing with Bad Api frequently.

See app running [here](https://rps-results.herokuapp.com/). See section [Heroku and MongoDB](#heroku-and-mongodb) why this can be sometimes slow when querying game results.

## Contents

- [Running locally](#running-locally)
- [Getting started developing environment](#getting-started-developing)
- [Tech stack and app structure](#tech-stack-and-app-structure)
- [Heroku and MongoDD](#heroku-and-mongodb)
- [Next steps](#next-steps)

## Running locally

To run app locally in production you can utilize Docker compose to run whole application with single command. However first you are required to to set a few environment variables. In `rps-backend`- folder there is file called `example.env`, copy that and rename it to `.env` (keep it in rps-backend folder). Set up following first three variables as you wish and keep the fourth as it is:
```
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
POSTGRES_HOST=postgres
``` 

Then run in root dir
```
docker-compose up
```
This will start Postgresql database and the actual NodeJS Express app with ReactJS frontend. You can access application in `localhost:3001`

Note that app will immediately start fetching data from Bad Api to Postgres db which will take a few minutes to fetch all the data. You can still start using application during that process and you will eventually be sync with Bad Api.

## Getting started developing

You can also start backend and frontend separately and run only Postgres with Docker. To do so follow these steps:

1. Set up `.env`- file as told [earlier](#running-locally). But now change also value of `POSTGRES_HOST` to `localhost`.
2. cd to `rps-backend` and run `docker-compose -f docker-compose.dev.yml up db` to start postgres database. This will also init your database utilizing [init.sql](./rps-backend/init.sql)- file.
3. Start another bash and cd to `rps-backend` and run `npm install` and after that `npm run dev` to start express backend in development mode. Backend is runinng on `localhost:3001`.
4. Start another bash and cd to `rps-frontend` and rub `npm install` and run `npm start` to start frontend.
5. Access application in `localhost:3000`

Again backend will start fetching data from Bad Api which may take a few minutes.

## Tech stack and app structure

App is divided into two parts: [frontend](./rps-frontend) and [backend](./rps-backend). In addition app utilizes database to store RPS game results and perform fast queries. In this stack app utilizes Postgres database. See also section [Heroku and MongoDB](#heroku-and-mongodb).

### Frontend

Frontend is built with ReactJS and Typescript. That is a popular stack nowadays to built frontend. Typescript helps to avoid runtime errors and helps new developers to jump into the project.

It utilizes [redux-toolkit](https://redux-toolkit.js.org/introduction/getting-started) to store app state and in simple cases it uses simply `useState`- hooks to store state. Redux-toolkit makes using redux quite an easy and fasten the development process. However sometimes it's just more faster and simplier to use basic React useState hook. However on step to improve project and make it clearer could be to use only redux to store state.

[Material UI](https://mui.com/) is used to style the app. I have used this library earlier and I'm also currently utilizing it in another project and have find that it's easy to use and result is nice so I decided to use it in this project too. The documentation of MUI also provides good examples for new developers to get started with library.

Both frontend and backend use [Ajv](https://www.npmjs.com/package/ajv) to validate data. The same time as data is validated against JSONSchema it gets types so it's nice to use with Typescript. Also in backend data received from Bad Api is validated to be sure that 3rd party API gives correct data for app.

### Backend

Backend is built with NodeJS and [Express framework](https://expressjs.com/). As React, those are also very popular stack for backend nowadays and lot of documentation is available. Express is also a good choice for this kind of small backend but it still allows expanding backend when required. Backend is also written with Typescript.

In this project backend is basicly a server that (in production) serves the frontend files and performs queries to database and returns data to frontend. In addition backend syncs continously Bad Api with database utilized by this app.

There is no any authentication or authorization implemented so a quick look at code should give a good overview what backend does. The backend is also well commented in code level. I suggest to start reading code from [app.ts](./rps-backend/src/app.ts) and continuing to [historyData controller](./rps-backend/src/controllers/historyData.ts) and then to [historyData service](./rps-backend/src/services/historyDataService.ts).

## Heroku and MongoDB

I wanted to also deploy app to it be available through web. However I wouldn't like to pay for it so I was willing to deploy it to Heroku, a popular free hosting service for small POC apps.

However as my implementation required a database and Heroku's free Postgres add-on provides only 10 000 rows, I was required to figure out something else. I knew that MongoDB Atlas provides some free tier with sufficient amount of storage. I was required to refactor backend to use mongoose to connect MongoDB Atlas and perform queries to it. So this implementation can be found from [mongodb](https://github.com/pouju/reaktor-pre-assignment-2022-rps/tree/mongodb) branch in this repo.

However as MongoDB Atlas is free it started to throttle network speed as I started to push data from Bad Api to db through my backend sync mechanism. I solved it by exporting collected data from my local postgres db and imported it to MongoDB atlas with `mongoimport`- tool. This was much faster and now it's possible to keep mongodb in sycn with Bad Api with backend sync mechanism as it needs to put only new game results to db occassionally.

The third branch [heroku](https://github.com/pouju/reaktor-pre-assignment-2022-rps/tree/heroku) is for deploying app to Heroku. It's almost the same as `mongodb`- brach with a few changes Heroku requires. The branch is connected to Heroku and every push to branch triggers a deploy process in Heroku. NOTE: as the Heroku app uses MongoDB Atlas free cluster it may be slow sometimes.

## Next steps

The project does not currently provide any tests so next step would be to implement tests for the frontend and backend. For example Cypress could be a good tool for end-to-end testing.