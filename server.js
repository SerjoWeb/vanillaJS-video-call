/** require module dependencies and init */
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuid4 } = require('uuid');

/** set config of modules */
app.set('view engine', 'ejs');
app.use(express.static('public'));

/** routes */
app.get('/', (req, res) => {
    res.redirect(`/${uuid4()}`);
});

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
});

/** socket connections, options ans settings */
io.on('connection', (socket) => {
    socket.on('join-room', (roomId,  userId) => {
        socket.join(roomId);

        socket.on('ready',() => {
            socket.broadcast.to(roomId).emit('user-connected', userId);
        });

        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId);
        });
    });
});

/** listen port */
server.listen(5050);