import { Module } from '@nestjs/common';
import { SuperService } from './super.service';
import { SuperController } from './super.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SuperController],
  providers: [SuperService],
  exports: [SuperService],
})
export class SuperModule {}
