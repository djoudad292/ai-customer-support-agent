import { Module } from '@nestjs/common';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';
import { EmbeddingService } from './embedding.service';

@Module({
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseService, EmbeddingService],
  exports: [KnowledgeBaseService, EmbeddingService],
})
export class KnowledgeBaseModule {}
