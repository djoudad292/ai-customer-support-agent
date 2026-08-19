import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ConversationsModule } from './conversations/conversations.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { LeadsModule } from './leads/leads.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { CompaniesModule } from './companies/companies.module';
import { DepartmentsModule } from './departments/departments.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AgentModule } from './agent/agent.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './common/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    ConversationsModule,
    KnowledgeBaseModule,
    LeadsModule,
    AppointmentsModule,
    CompaniesModule,
    DepartmentsModule,
    AnalyticsModule,
    AgentModule,
    HealthModule,
  ],
})
export class AppModule {}
