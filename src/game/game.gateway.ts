import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

interface ScoreData {
  name: string;
  email: string;
  score: number;
}

@WebSocketGateway({ namespace: '/game', cors: true })
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private gameService: GameService) {}

  afterInit() {
    console.log('✅ WebSocket gateway initialized at /game');
  }

  handleConnection(client: Socket) {
    console.log(`🚀 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('submitScore')
  async handleScore(@MessageBody() data: ScoreData) {
    try {
      if (!data.name || !data.email || typeof data.score !== 'number') {
        throw new Error('Invalid score submission data.');
      }

      console.log('📥 Received score:', data);

      // Save score in DB
      await this.gameService.saveScore(data.name, data.email, data.score);

      // Get top 3 scores
      const top3 = await this.gameService.getTopScores();

      console.log('🏆 Top 3 scores:', top3);

      // Broadcast to all clients
      this.server.emit('topScores', top3);

      return {
        status: 'ok',
        top3,
      };
    } catch (error) {
      console.error('❗Error handling score submission:', error.message);

      return {
        status: 'error',
        message: error.message || 'Something went wrong while processing the score.',
      };
    }
  }

  @SubscribeMessage('getTopScores')
  async handleGetTopScores() {
    try {
      const top3 = await this.gameService.getTopScores();

      return {
        status: 'ok',
        top3,
      };
    } catch (error) {
      console.error('❗Error retrieving top scores:', error.message);
      return {
        status: 'error',
        message: error.message || 'Failed to retrieve top scores.',
      };
    }
  }
}
