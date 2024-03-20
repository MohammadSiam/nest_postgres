import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionOptions, createConnection } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './user/entities/user.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot(), // Load environment variables from .env file
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const connectionOptions: ConnectionOptions = {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          entities: [User],
          synchronize: true,
        };

        try {
          // Attempt to create a connection
          const connection = await createConnection({
            ...connectionOptions,
            database: 'template1', // Connect to an existing database
          });

          // Execute a query to check if the target database exists
          const databaseExistsQuery = `SELECT 1 FROM pg_database WHERE datname = '${connectionOptions.database}'`;
          const databaseExists = await connection.query(databaseExistsQuery);

          if (databaseExists.length === 0) {
            // If the database doesn't exist, execute the CREATE DATABASE command
            await connection.query(
              `CREATE DATABASE ${connectionOptions.database}`,
            );
            console.log(
              `Database '${connectionOptions.database}' created successfully.`,
            );
          }

          // Close the temporary connection
          await connection.close();
        } catch (error) {
          console.error('Error creating database:', error);
          throw error;
        }

        return connectionOptions;
      },
      inject: [ConfigService],
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
