# Link to Access the project:

https://assignment3-frontend-415323.ue.r.appspot.com/search/home

`npm start` to run the backend application (move to the backend folder)

# For Backend Deployment

1. `gcloud init`

2. `gcloud app deploy`

`ng serve` to run the frontend application (move to the frontend folder)

# For Frontend Deployment

1. Change all url of http://localhost:3000/.... to backend url (https://assignment3-backend.uw.r.appspot.com/) in app.services.ts file

2. Delete current dist folder

3. `ng build --configuration production`

4. `gcloud init`

5. `gcloud app deploy`

Note: run `npm install` to install all the dependencies
