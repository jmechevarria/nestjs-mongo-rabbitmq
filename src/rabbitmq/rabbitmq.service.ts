import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, {
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';

import { ConfirmChannel, ConsumeMessage } from 'amqplib';

@Injectable()
export class RabbitmqService implements OnModuleInit {
  private connection: AmqpConnectionManager;
  private channel: ChannelWrapper;
  private readonly mqServerUrl: string;
  private readonly exchange: string;
  private readonly emailQueue: string;

  constructor(private readonly configService: ConfigService) {
    this.mqServerUrl = this.configService.get<string>('MESSAGE_QUEUE_URL');
    this.exchange = this.configService.get<string>('MESSAGE_QUEUE_EXCHANGE');
    this.emailQueue = this.configService.get<string>('MESSAGE_QUEUE_EMAIL');
  }

  onModuleInit() {
    this.connect();
    this.connectConsumer();
  }

  async pushToEmailQueue(text: string) {
    await this.pushToQueue(this.emailQueue, text);
  }

  private connect() {
    try {
      this.connection = amqp.connect([this.mqServerUrl]);
      this.channel = this.connection.createChannel({
        setup: (channel: ConfirmChannel) => {
          return this.setupQueue(channel);
        },
      });

      console.log('Connected to rabbitmq server');
    } catch (error) {
      console.error('Error connecting to rabbitmq server', error);
    }
  }

  private async setupQueue(channel: ConfirmChannel) {
    try {
      if (!this.emailQueue) return;

      await channel.assertQueue(this.emailQueue, { durable: true });
      await channel.assertExchange(this.exchange, 'direct', { durable: true });

      await channel.bindQueue(this.emailQueue, this.exchange, this.emailQueue);

      console.log('Queue is ready to receive messages');
    } catch (error) {
      console.error('Error while setting up queue', error);
    }
  }

  private async connectConsumer() {
    try {
      this.connection.createChannel({
        setup: (channel: ConfirmChannel) => {
          return this.consumeMessage(channel);
        },
      });

      console.log('Consumer is ready to receive messages');
    } catch (error) {
      console.error('Error while setting up consumer', error);
    }
  }

  private async consumeMessage(channel: ConfirmChannel) {
    try {
      await channel.prefetch(10);
      await channel.consume(this.emailQueue, (message: ConsumeMessage) =>
        this.handleMessage(channel, message),
      );
    } catch (error) {
      console.error('Error consuming email queue message', error);
    }
  }

  private async handleMessage(channel: ConfirmChannel, message: any) {
    try {
      channel.ack(message);
      console.log('Message acknowledged');
    } catch (error) {
      console.log('Error handling message', error);
      channel.nack(message);
    }
  }

  private async pushToQueue(queue: string, text: string) {
    try {
      if (!this.channel) this.connect();

      await this.channel.sendToQueue(queue, text, { persistent: true });

      console.log('message pushed to queue');
    } catch (error) {
      console.log('Error pushing message to queue', error);
    }
  }
}
