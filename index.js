const express = require('express')
const app = express()
const path = require('path')
const mqtt = require('mqtt')
const WebSocket = require('ws')
const WebSocketServer = require('ws').Server
const dbo = require('./models/conn')
const microcontroller = require('./controllers/microcontroller')
const PRIVATE_KEY = require('./firebase-adminsdk')
const admin = require('firebase-admin')
const port = process.env.PORT || 3000
const cors = require('cors')
const cookieParser = require('cookie-parser')
const history = require('connect-history-api-fallback')

//cors
app.use(
  cors({
    credentials: true,
    origin: ['https://lightstream.site'],
  })
)
//cookie-parser middleware
app.use(cookieParser())
//JSON middleware
app.use(express.json())
//history
app.use(history())
//static images
app.use('/static', express.static(path.join(__dirname, 'static')))
//static vue
app.use('/', express.static(path.join(__dirname, 'dist')))

//service-accounts
var serviceAccount = PRIVATE_KEY

//initialize-app
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

//handle-request-on-index
app.all('/', function (req, res, next) {
  res.status(400).send({
    error: 'invalid url',
    message: 'please review your destination address',
  })
  next()
})

//router
app.use('/', require('./routes/registration-token'))
app.use('/', require('./routes/lighting'))
app.use('/auth', require('./routes/auth'))
app.use('/users', require('./routes/users'))

// perform a database connection when the server starts
function dbConnection() {
  dbo.connectToServer(function (err) {
    if (err) {
      console.log(`Unable to connect to the Mongo db  ${err} `)
      setTimeout(() => dbConnection(), 10000)
    } else {
      let server = app.listen(port, () => {
        console.log(`server is running in port http://localhost:${port}`) // start the Express server
      })
      const wss = new WebSocketServer({ server })
      wss.on('connection', function connection(ws) {
        ws.on('message', function message(data) {
          console.log('received: %s', data)
        })
        console.log('websocket connected')
      })
      const client = mqtt.connect(process.env.MQTT, {
        clientId: process.env.MQTT_CLIENT_ID,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
      })
      client.on('connect', function () {
        try {
          client.subscribe('mqtt')
          client.on('message', function (topic, message) {
            microcontroller.checkDatabase(JSON.parse(message), (message) => {
              wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(message))
                }
              })
            })
          })
        } catch (err) {
          console.log(err)
        }
        console.log('mqtt connected')
      })
    }
  })
}

dbConnection()
