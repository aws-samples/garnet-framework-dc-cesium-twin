# Garnet Web Digital Twin

## Introduction:
In this short demo, we will show how to build a efficient digital twin based on the garnet framework: https://garnet-framework.dev/

This digital twin will show real time Bike Stations usage and/or Parking occupation.

Here a live version of this project:
https://d11w1ienzwldkl.cloudfront.net/

![Lille Smart Cities](images/lille.png)

## Concept:  
Data shown on the digital is provided by the Garnet Framework.  
Garnet Framework offers several ways to consume the data. In this example we will query the FIWARE Context Broker using the NGSI-LD API.
Some example of the queries we use in this example:  
```
curl --location --request GET 'https://r16w0ohr0i.execute-api.eu-west-1.amazonaws.com/ngsi-ld/v1/entities/?limit=1000&type=OffStreetParking' \
--header 'Link: <https://raw.githubusercontent.com/awslabs/garnet-framework/main/context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
--header 'Content-Type: application/json'
```

## Prerequisites:
A Garnet Stack deployed,   
This project uses 2 Datamodels `HiringDockingBike` and/or `OffStreetParking`:

* https://github.com/smart-data-models/dataModel.Transportation/tree/master/BikeHireDockingStation
* https://github.com/smart-data-models/dataModel.Parking/tree/master/OffStreetParking

## Deployment:
The front-end is react based, and we will use the cesium-js plugin.  
The other libraries used are tailwind-css and shadcn-ui.

Clone the repository:  
`git clone git@ssh.gitlab.aws.dev:garnet-framework/garnet-digital-twin.git`  
`cd` into the directory  

copy .env.example to .env and update it with your Garnet base URL, For instance :  
`https://r16w0ohr0i.execute-api.eu-west-1.amazonaws.com/ngsi-ld/v1/entities`

run the following command to install the dependencies locally:  
`npm install`

run the followind command to run the project:  
`npm run dev`

You can now browse to http://localhost:5173/

## Hosting:
You can build the website for deployment using the `npm run build` command. It will be build some files in the `dist` directory of the project.
As it is a static website, you just need a web server to serve the files the `dist` directory.
For the live demo here, the files are on a S3 bucket fronted by Cloudfront (A Content Delivery Network).


