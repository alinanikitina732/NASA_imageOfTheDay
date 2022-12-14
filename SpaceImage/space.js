process.stdin.setEncoding("utf8");

const fs = require("fs");
const http = require("http");
const path = require("path");
const axios = require("axios");
const express = require("express"); /* accessing express module */
const app = express(); /* app is a request handler function */

const NASA_API_KEY = "rMFZN0qWDR7uIoo0jq0TOySE50QZa1UXBMRFw0a3";

require("dotenv").config({ path: path.resolve(__dirname, './.env') });

let bodyParser = require("body-parser");
const { response } = require("express");

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

const databaseAndCollection = {db: "CMSC335_DB", collection:"spaceImages"};

app.set("view engine", "ejs");
app.set("views", (__dirname + "/templates"));
app.use(bodyParser.urlencoded({extended:false}));

const { MongoClient, ServerApiVersion } = require('mongodb');

/* command line interpreter */

if (process.argv.length != 3) {
    process.stdout.write("Usage space.js portNumber\n");
    process.exit(1);
}

const portNumber = process.env.PORT || process.argv[2];

process.stdout.write("Web server started and running at https://nasa-imageoftheday.onrender.com/" + "\n");
let prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);

process.stdin.on("readable", function () {
    let dataInput = process.stdin.read();

    if (dataInput != null) {

        let command = dataInput.trim();

        if (command == "stop") {
            process.stdout.write("Shutting down the server\n");
            process.exit(0);
        } else {
            process.stdout.write("Invalid command: can only use 'stop' to shutdown server\n");
        }

    }

    process.stdout.write(prompt);
    process.stdin.resume();
});

async function main() {
    const uri = `mongodb+srv://${userName}:${password}@cluster0.haxqpmo.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    try {

        await client.connect(err => {
            
            // home page
            app.get("/", (request, response) => {
                const variables = {
                    addImage: `<a href=\"/image\">NASA astronomy image of the day</a>`,
                    lookupImage: `<a href=\"/lookupImage\">Search for an already seen image</a>`,
                    clearCollection: `<a href=\"/clearCollection\">Clear collection</a>`
                };

                response.render("home", variables);
            });

            // get date
            app.get("/image", (request, response) => {
                const variables = { url: `/processImage`,
                                    home: `<a href=\"/\">HOME</a>` };

                response.render("image", variables);
            });

            // post image from date
            app.post("/processImage", async (request, response) => {
                let dateString = `${request.body.year}-${request.body.month}-${request.body.day}`;

                console.log("before fetch from API");

                const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${dateString}`);

                console.log("after fetch from API: " + res);
                
                const data = await res.json();

                let result = await lookupSpaceImage(client, databaseAndCollection, dateString);

                // if space image not in database
                if (!result) {

                    let spaceImage = {
                        date: data.date,
                        title: data.title,
                        url: data.url,
                        explanation: data.explanation
                    }

                    // add space image to database
                    await insertSpaceImage(client, databaseAndCollection, spaceImage);

                }

                 const variables = {
                     imageDate: data.date,
                     imageTitle: data.title,
                     imageURL: data.url,
                     imageExplanation: data.explanation,
                     home: `<a href=\"/\">HOME</a>`
                };
                
                response.render("processImage", variables);
            });

            app.get("/lookupImage", (request, response) => {
                const variables = { url: `/processLookupImage`,
                                    home: `<a href=\"/\">HOME</a>` };

                response.render("lookupImage", variables);
            });

            app.post("/processLookupImage", async (request, response) => {
                let dateString = request.body.imageDate;

                let date = "NONE";
                let title = "NONE";
                let url = "NONE";
                let explanation = "NONE";

                let result = await lookupSpaceImage(client, databaseAndCollection, dateString);

                if (result) {
                    date = result.date;
                    title = result.title;
                    url = result.url;
                    explanation = result.explanation;
                }

                const variables = {
                    imageDate: date,
                    imageTitle: title,
                    imageURL: url,
                    imageExplanation: explanation,
                    home: `<a href=\"/\">HOME</a>`
                }

                response.render("processImage", variables);
            });

            app.get("/clearCollection", (request, response) => {
                const variables = { url: `/processClearCollection`,
                                    home: `<a href=\"/\">HOME</a>` };

                response.render("clearCollection", variables);
            });

            app.post("/processClearCollection", async (request, response) => {

                // remove all mongoDB entries returning number removed
                const result = await client.db(databaseAndCollection.db)
                .collection(databaseAndCollection.collection)
                .deleteMany({});
                
                const variables = { num: result.deletedCount,
                                    home: `<a href=\"/\">HOME</a>` };

                response.render("processClearCollection", variables);
            });

            app.listen(portNumber);
        });

    } catch (e) {
        console.error(e);
    } finally {
        client.close()
    }

}

async function insertSpaceImage(client, databaseAndCollection, newSpaceImage) {
    await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newSpaceImage);
}

async function lookupSpaceImage(client, databaseAndCollection, date) {
    let filter = {date: date};

    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).findOne(filter);

    return result;
}

main().catch(console.error);


