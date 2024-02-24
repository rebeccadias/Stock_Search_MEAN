# For Backend Deployment

1. gcloud init

2. gcloud app deploy

# For Frontend Deployment

1. Change all url of http://localhost:3000/.... to backend url

2. Delete current dist folder

3. ng build --configuration production

4. gcloud init

5. gcloud app deploy