const express = require('express');
const app = express();
const mqtt = require('mqtt');
const WebSocket = require('ws');
const WebSocketServer = require('ws').Server;
const dbo = require('./db/conn');
const notification = require('./firebase-messaging/notification-helper')
const PRIVATE_KEY = require('./firebase-adminsdk')
const admin = require("firebase-admin");
const port = process.env.PORT || 3000;
const cors = require('cors');
const timeout = require('connect-timeout')
const cookieParser = require('cookie-parser')

//timeout
app.use(timeout('5s'))
//cors
app.use(cors({
  credentials: true,
  origin: ['https://staging-wathcr.web.app', 'http://127.0.0.1:8887', 'http://localhost:8080', 'http://192.168.1.5:8080'],
  // allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(haltOnTimedout)
//cookie-parser middleware
app.use(cookieParser())
//haltOnTimedout
app.use(haltOnTimedout)
//JSON middleware
app.use(express.json());
//haltOnTimedout
app.use(haltOnTimedout)

//service-accounts
var serviceAccount = PRIVATE_KEY;

//initialize-app
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//handle-request-on-index
app.all('/', function (req, res, next) {
  res.status(400).send({
    error: "invalid url",
    message: "please review your destination address"
  })
  next()
})

//router
app.use('/', require('./route/registration-token'))
app.use('/', require('./route/lighting'))
app.use('/auth', require('./route/auth'))

//function timeout
function haltOnTimedout(req, res, next) {
  if (!req.timedout) next()
}

// perform a database connection when the server starts
function dbConnection() {
  dbo.connectToServer(function (err) {
    if (err) {
      console.log(`Unable to connect to the Mongo db  ${err} `);
      setTimeout(() => dbConnection(), 10000)
    } else {
      // start the Express server
      let server = app.listen(port, () => {
        console.log(`server is running in port http://localhost:${port}`)
      })
      //start the Websocket
      const wss = new WebSocketServer({
        server
      })
      wss.on('connection', function connection(ws) {
        ws.on('message', function message(data) {
          console.log('received: %s', data);
        });
        console.log('websocket connected')
      });
      //start mqtt
      const client = mqtt.connect('mqtt://192.168.1.5', {
        clientId: "sub_to_db",
        username: "azure",
        password: "azure"
      })
      client.on('connect', function () {
        client.subscribe('mqtt', function (err) {
          client.on('message', function (topic, message) {
            notification.checkDatabase(JSON.parse(message), (message) => {
              //send websocket message
              wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    message
                  }))
                }
              })
            }).catch((err) => {
              console.log(err)
            })
          })
        })
        console.log('mqtt connected')
      })
    }
  });
}

dbConnection()