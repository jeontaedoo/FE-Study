import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

const app = express();
const port = 8000;

// HTTP 서버 생성, express 앱을 HTTP 서버로 감싸기 위해 사용
const server = createServer(app);

// Socket.IO 서버 생성
const io = new SocketIOServer(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true
    }
});

// CORS 설정 (Express - 라우트 사용)
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

const chatNameSpace = io.of('/room');

// Socket.IO 이벤트 처리
chatNameSpace.on('connection', (socket) => {
    console.log('New client connected');

    // 클라이언트가 방에 들어갈 때 - 그룹일때 인원 수 지정 추가 예정
    socket.on('join', (data) => {
        const roomId = data.roomId.toString();
        const roomName = data.roomName.toString();
        const roomType = data.roomType.toString();
        const roomLimit = parseInt(data.roomLimit);

        const roomFilter = `${roomId}_${roomName}_${roomType}_${roomLimit}`; // 동일한 채팅방 필터링
        socket.join(roomFilter);
        console.log(`Client joined room ${roomFilter}`);

        // 방에 있는 클라이언트 수
        const roomClientCount = chatNameSpace.adapter.rooms.get(roomFilter)?.size || 0;
        // 인원수 제한
        if(roomLimit && roomClientCount > roomLimit){
            // socket.emit('error', '입장 가능 인원이 가득 찼습니다.');
            socket.emit('roomStatus',{isFull: true, message: `입장 가능 인원이 가득 찼습니다. (${roomClientCount - 1} / ${roomLimit})`})
            return;
        } else {
            socket.emit('roomStatus',{isFull: false, message: `입장`})
        }
        // 유저 접속 알림
        chatNameSpace.to(roomFilter).emit('message', `새로운 유저가 접속했습니다. 현재 유저 ${roomClientCount} 명`);

    });


    // 클라이언트가 메시지를 보낼 때
    socket.on('message', (data) => {
        const roomId = data.roomId.toString();
        const roomName = data.roomName.toString();
        const roomType = data.roomType.toString();
        const roomLimit = parseInt(data.roomLimit);

        const message = data.message
        const roomFilter = `${roomId}_${roomName}_${roomType}_${roomLimit}`;

        console.log(`Message from room ${roomFilter}: ${message}`);
        // 특정 방에 있는 모든 클라이언트에게 메시지를 전송합니다.
        chatNameSpace.to(roomFilter).emit('message', message);
    });

    // 유저가 연결을 끊었을 때
    socket.on('disconnect', () => {
        // 클라이언트가 속한 모든 방에서 나갑니다.
        const rooms = Array.from(socket.rooms);
        rooms.forEach((roomId) => {
            if (roomId !== socket.id) {
                socket.leave(roomId);
                const roomClientCount = chatNameSpace.adapter.rooms.get(roomId)?.size || 0;
                chatNameSpace.to(roomId).emit('message', `유저 한명이 떠났습니다. 현재 유저 ${roomClientCount} 명`);
            }
        });

        console.log('Client disconnected');
    });
});

// 간단한 API 엔드포인트 설정 (선택 사항)
app.use('/api', (req, res) => {
    res.send('Express API response');
});

// 서버 시작
server.listen(port, () => {
    console.log(`Express server and WebSocket server listening on port ${port}`);
});
