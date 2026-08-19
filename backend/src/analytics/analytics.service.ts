import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(companyId: string) {
    const [
      totalConversations,
      activeConversations,
      totalLeads,
      newLeads,
      totalAppointments,
      pendingAppointments,
      totalDocuments,
    ] = await Promise.all([
      this.prisma.conversation.count({ where: { companyId } }),
      this.prisma.conversation.count({ where: { companyId, status: 'active' } }),
      this.prisma.lead.count({ where: { companyId } }),
      this.prisma.lead.count({ where: { companyId, status: 'new' } }),
      this.prisma.appointment.count({ where: { companyId } }),
      this.prisma.appointment.count({ where: { companyId, status: 'requested' } }),
      this.prisma.document.count({ where: { companyId } }),
    ]);

    return {
      totalConversations,
      activeConversations,
      totalLeads,
      newLeads,
      totalAppointments,
      pendingAppointments,
      totalDocuments,
    };
  }
}
