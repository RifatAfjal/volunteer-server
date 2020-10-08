const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config()

const app = express();
app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./Configs/volunteer-network-ec7e3-firebase-adminsdk-3c03c-6ea691a683.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DB_FIRE
});



const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vuwbx.mongodb.net/volunteerNetwork?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const collection = client.db("volunteerNetwork").collection("volunteers");
    const DataCollection = client.db("volunteerNetwork").collection("FakeData");

    app.get('/volunteerEvents',(req,res) => {
        const bearer = req.headers.authorization;
        if(bearer && bearer.startsWith("Bearer ")){
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
            .then(decodedToken => {
                const tokenEmail = decodedToken.email;
                if(tokenEmail === req.query.email){
                    collection.find({email:req.query.email})
                    .toArray((err,events) => {
                        res.send(events)
                    })
                }
                else{
                    res.status(401).send('un-authorized access')
                }
                
            })
            .catch(error => {
                res.status(401).send('un-authorized access')
            });
        }
        else{
            res.status(401).send("un-authorized access")
        } 
    })

    app.post('/addVolunteer',(req,res) => {
        const newVolunteer = req.body;
        collection.insertOne(newVolunteer)
        .then( result => {
            res.send(result.insertedCount > 0)
        })
    })


    app.post('/addFakeData',(req,res) => {
        const FakeData = req.body;
        DataCollection.insertOne(FakeData)
        .then(result => {
            res.send(result.insertedCount > 0)
        })
    })


    app.get('/networksData',(req,res) => {
        DataCollection.find({})
        .toArray((err,networksData) => {
            res.send(networksData)
        })
    })


    app.get('/volunteers',(req,res) => {
        collection.find({})
        .toArray((err, events) => {
            res.send(events)
        })
    })


    app.delete('/deleteOne/:id',(req,res) => {
        console.log(req.params.id)
        collection.deleteOne({_id:ObjectId(req.params.id)})
        .then(result => {
            res.send(result.deletedCount > 0);
        })
    })

    app.delete('/deleteVolunteer/:id',(req,res) => {
        console.log(req.params.id)
        collection.deleteOne({_id:ObjectId(req.params.id)})
        .then(result => {
            res.send(result.deletedCount > 0);
        })
    })
});


app.listen(process.env.POST || 5000);