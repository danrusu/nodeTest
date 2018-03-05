var express = require('express')
var bodyParser = require('body-parser')

var app = express()
// socket.io needs to tie in with express:
// create http server with node and share with express
var http = require('http').Server(app)
// share server with socket.io
var io = require('socket.io')(http)

var mongoose = require('mongoose')

app.use(express.static(__dirname)) // set root to currentDir/index.html
app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({extended: false}))


var dbUrl = 'mongodb://user:user@ds151049.mlab.com:51049/learning-node';

// set Mongo DB model and schema
var Message = mongoose.model('Message', {
  name: String,
  message: String
  //creates an id
})

var messages = [
/*    {name: 'Tim', message: 'Hi'},
    {name: 'Jane', message: 'Hello'}*/
]

app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages)        
    })
})


app.post('/messages', (req, res) => {
    var message = new Message(req.body)

    message.save( err => {
        if (err){
            sendStatus(500)
        }
            
        Message.findOne({message: 'badword'}, (err, censored) => {
            if(censored){
                console.log('censored word found ', censor)
                Message.remove({_id: censored.id}, err => {
                    console.log('removed censored message')
                })
            }
        })

        io.emit('message', req.body)
        res.sendStatus(200)
    } )

})


io.on('connection', socket => {
    console.log('a user connected')
})




mongoose.connect(dbUrl, (err) => {
    console.log('mongo db connection', err)
})


var server = http.listen(3000, () =>{
    console.log('server is running on port', server.address().port)
})


