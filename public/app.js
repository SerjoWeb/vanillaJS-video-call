;((window) => {
    'use strict';

    class VideoChat {
        users = document.getElementById('users');

        socket = undefined;

        peer = new Peer(undefined, {
            host: '/',
            port: 5051
        });

        callList = [];
        callList2 = [];

        peers = {};

        constructor() {
            console.info('Video chat has started');

            this.connectToSocket();
            this.initPeer();
            this.renderVideo();
            this.userDisconnect();
        }

        initPeer() {
            this.peer.on('open', (id) => {
                this.joinRoom(id);
            });
        }

        connectToSocket() {
            this.socket = io('/');
        }

        joinRoom(userId) {
            this.socket.emit('join-room', ROOM_ID, userId);
        }

        renderVideo() {
            const video = document.createElement('video');

            video.muted = true;
            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            }).then((stream) => {
                this.socket.on('user-connected', (userId) => {
                    this.connectNewUser(userId, stream);
                });

                this.addStream(video, stream);

                this.peer.on('call', (call) => {
                    const newVideo = document.createElement('video');

                    call.answer(stream);
                    call.on('stream', (videoStream) => {
                        if (!this.callList2[call.peer]) {
                            this.addStream(newVideo, videoStream);
                            this.callList2[call.peer] = call;
                        }
                    });
                });

                this.socket.emit('ready');
            });
        }

        connectNewUser(userId, stream) {
            console.info(`${userId} connected to stream`);

            const call = this.peer.call(userId, stream);
            const userVideo = document.createElement('video');

            call.on('stream', videoStream => {
                if (!this.callList[call.peer]) {
                    console.info(`${userId} is on stream`);

                    this.addStream(userVideo, videoStream);
                    this.callList[call.peer] = call;
                }
            }, (error) => {
                console.error(error);
            });

            call.on('close', () => {
                console.info(`${userId} has left stream`);

                userVideo.remove();
            }, (error) => {
                console.error(error);
            });

            this.peers[userId] = call;
        }

        addStream(video, stream) {
            if (this.users) {
                video.srcObject = stream;
                video.autoplay = true;
                video.addEventListener('loadedmetadata', () => {
                    video.play();
                });

                this.users.append(video);
            }
        }

        userDisconnect() {
            this.socket.on('user-disconnected', (userId) => {
                this.peers[userId] && this.peers[userId].close();
            });
        }
    }

    new VideoChat();
})(window);