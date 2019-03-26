const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const MongoClient = require('mongodb').MongoClient;

const dbName = 'bulb';
const dbCollectionName = 'bulbStatus';
const port = process.env.PORT || 5000;

//Database
MongoClient.connect('mongodb://localhost:27017',{ useNewUrlParser: true },(err, client)=>{
    if (err) {
        console.log('Database connection error!')
        throw err;
    }
    console.log('Connected to database')
    
    const db = client.db(dbName);
    const bulbStatus = db.collection(dbCollectionName);
      
    //Socket.io
    io.on('connection',(socket)=>{
        //Send bulb status from database to client
        bulbStatus.find({},{projection:{ _id: 0 }}).toArray((err,res)=>{
            io.emit('server bulbStatus changed', res[0].bulbStatus);
        });
        //Get client event
        socket.on('client bulbStatus changed', (i,status)=>{
            let setObject = {};
            setObject['bulbStatus.'+ i] = status;
            //Update bulb status in database
            bulbStatus.updateOne(
                { '_id': 1 },
                { '$set': setObject }
            );
            //Send bulb status from database to client
            bulbStatus.find({},{projection:{ _id: 0 }}).toArray((err,res)=>{
                io.emit('server bulbStatus changed', res[0].bulbStatus);
            });
        });
    });
});

app.use(express.static('public'));

app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/index.html');
});

server.listen(port, ()=>console.log('Listening on port ' + port));