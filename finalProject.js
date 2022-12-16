/* Stuff for server */

const portNumber = process.argv[2];

const path = require("path");
const http = require("http");
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') }) 

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

/* Our database and collection */
const databaseAndCollection = {db: "CMSC335_Final", collection:"totalCalls"};


const bodyParser = require("body-parser");
const express = require("express"); /* Accessing express module */

const app = express(); /* app is a request handler function */
app.set('view engine', 'ejs');
app.set("views", path.resolve(__dirname, "templates")); /* directory where templates will reside */

const { MongoClient, ServerApiVersion } = require('mongodb');
app.use(bodyParser.urlencoded({extended:false})); /* Initializes request.body with post information */ 

app.use(express.static(__dirname + '/templates'));

const uri = `mongodb+srv://${userName}:${password}@cluster0.ou2vl8f.mongodb.net/?retryWrites=true&w=majority`

const iter = ["genshin", "wrongInput"]
 
let character_json = require(`./character.json`)
let loc_json = require(`./loc.json`)
let UID = 609066389

async function totalCalls(userInput) {

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    try {
        await client.connect();
       

    
    let r_val = ""

    for await(let userInput of iter) {
        filter = {name: userInput};
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .findOne(filter);
    
        if (result) {
            r_val = r_val + (`<tr><td>${userInput}</td><td>${result.calls}</td></tr>`) 
        } else {
            r_val = r_val + (`<tr><td>${userInput}</td><td>${0}</td></tr>`) 
        }
    
    }


    return r_val
    

    } catch (e) {
        console.error(e);
    } 

}


async function increment(userInput) {

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    try {
        await client.connect();
       

        lookUp(userInput).then(async (res) => { 
            let variables = {}
            // console.log(res)
            if (res == null) {
                variables = {name: userInput, calls: 1}
                const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(variables);
            } else {
                variables = {name: userInput, calls: (res.calls + 1)}
                
                const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).updateOne({name: userInput}, {$set:{calls: (res.calls + 1)}})
            }
        
        })
    
        
    } catch (e) {
        console.error(e);
    } 

}

async function lookUp(userInput) {

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    try {
        await client.connect();

        filter = {name: userInput};
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .findOne(filter);

        if (result) {
            return result
        } else {
            return null
        }


    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }


}

async function clear_db() {

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    try {
        await client.connect();
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});

        return result.deletedCount

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

app.get("/", async (request, response) => {


    let myVar = portNumber;


    totalCalls().then((res) => {

        let table = "<table><tr><th>Name</th> <th>Call Count</th></tr>"

        table = table + res

        table = table + "</table>"

        response.render('index.ejs', { myVar : myVar, table: table});

    })

});

app.post("/userInput", (request, response) => {

    let { userInput } = request.body;

    userInput = userInput.trim()
    console.log(userInput)

    let sanitizedUserInput = iter[2] // "wrongInput"

    // if ((userInput == iter[0] || userInput == iter[1])) {
    //     sanitizedUserInput = userInput
    // } 

    // if input works as UID increment genshin

    url = `https://enka.network/u/${userInput}/__data.json`

    fetch(url)
    .then(res => res.json())
    .then(out => {

        if (Object.keys(out).length !== 0)  {

            increment("genshin")

            response.redirect("/genshin");

            UID = userInput

        } else {
            
            increment("wrongInput")

            response.redirect("/wrongInput");

        }

    })


});


app.post("/callsReset", (request, response) => {
    let myVar = portNumber;

    clear_db().then((res) => { 
        response.redirect('back');
    })

});


app.get("/genshin", async (request, response) => {

    let myVar = portNumber;

    url = `https://enka.network/u/${UID}/__data.json`

    fetch(url)
    .then(res => res.json())
    .then(out => {


        let table = "<table><tr><th>Name</th> <th>Icon</th> <th>Level</th> <th>Crit Chance</th> <th>Crit Damage</th></tr>"
        // out.playerInfo.showAvatarInfoList
        out.avatarInfoList.forEach(element => {

            
            table = table + `<tr><td>${loc_json["en"][character_json[element.avatarId]["NameTextMapHash"]]}</td> <td><img src = https://enka.network/ui/${character_json[element.avatarId]["SideIconName"]}.png> </td> <td>${element.propMap[4001]["val"]}</td> <td>${(element.fightPropMap[20] * 100).toFixed(2)}%</td> <td>${(element.fightPropMap[22] * 100).toFixed(2)}%</td> </tr>`

        });

        
        table = table + "</table>"

        response.render('genshin.ejs', { myVar : myVar, table: table, UID: UID});

    }

      )
      
});


app.get("/wrongInput", async (request, response) => {

    let myVar = portNumber;

    response.render('wrongInput.ejs', { myVar : myVar});

});



app.listen(portNumber);

console.log(`Web server is running at http://localhost:${portNumber}`);

process.stdout.write("Stop to shutdown the server: ");
process.stdin.setEncoding("utf8"); /* encoding */
process.stdin.on('readable', () => {  /* on equivalent to addEventListener */
	let dataInput = process.stdin.read();

    // console.log(`Current arguments: ${process.argv}`)

	while (dataInput !== null) {
		let command = dataInput.trim();
		if (command === "stop") {
			console.log("Shutting down the server");
            process.exit(0);  /* exiting */
        }
        else {
			/* After invalid command, we cannot type anything else */
			console.log(`Invalid command: ${command}`);
            process.stdout.write("Stop to shutdown the server: ");
            dataInput = process.stdin.read();
		}
    }
});

