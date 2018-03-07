var app = require('express')();

var http = require('http').Server(app);

var io = require('socket.io')(http);



app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
  });
  


app.post('/update', (req, res) => {

        io.emit('message', req.body);

        res.sendStatus(200);
})


io.on('connection', socket => {
    console.log('a user connected');
    socket.on('disconnect', 
      () => console.log('user disconnected'))
    ;
})



var server = http.listen(3000, () =>{
    console.log('server is running on port', server.address().port)
})


