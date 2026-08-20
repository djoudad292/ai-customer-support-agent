import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const companyId = 'demo-company-001';
  const demoEmail = 'test@example.com';
  const demoPassword = 'password123';

  const passwordHash = await bcrypt.hash(demoPassword, 10);

  const company = await prisma.company.upsert({
    where: { id: companyId },
    update: {},
    create: {
      id: companyId,
      name: 'Demo Company',
      slug: 'demo-company',
      plan: 'pro',
      settings: {
        widgetTheme: 'dark',
        autoReply: true,
        businessHours: { start: '09:00', end: '17:00', timezone: 'UTC' }
      }
    }
  });
  console.log('✅ Company created:', company.name);

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { passwordHash },
    create: {
      email: demoEmail,
      passwordHash,
      name: 'Demo User',
      role: 'admin',
      companyId
    }
  });
  console.log('✅ User created:', user.email);

  const documents = [
    {
      title: 'FAQ - Shipping & Returns',
      content: `
# Frequently Asked Questions

## Shipping
- Standard shipping takes 3-5 business days
- Express shipping takes 1-2 business days
- International shipping takes 7-14 business days
- Free shipping on orders over $50

## Returns
- 30-day return policy for unused items
- Return shipping is free for defective items
- Refunds processed within 5-7 business days
- Exchanges available for size/color changes

## Order Tracking
- Tracking numbers emailed within 24 hours
- Track orders at: track.example.com
- Contact support if tracking not updated after 48 hours
      `,
      filename: 'faq-shipping.txt',
      mime: 'text/plain',
      sizeBytes: 500,
      pageCount: 1,
      status: 'ready',
      published: true,
      companyId
    },
    {
      title: 'Product Catalog - Electronics',
      content: `
# Product Catalog

## Smartphones
- iPhone 15 Pro - $999
- Samsung Galaxy S24 - $899
- Google Pixel 8 - $699

## Laptops
- MacBook Pro 14" - $1999
- Dell XPS 13 - $1299
- ThinkPad X1 Carbon - $1499

## Accessories
- AirPods Pro - $249
- Samsung Galaxy Buds - $179
- USB-C Hub - $79
      `,
      filename: 'catalog-electronics.txt',
      mime: 'text/plain',
      sizeBytes: 400,
      pageCount: 1,
      status: 'ready',
      published: true,
      companyId
    },
    {
      title: 'Support Policies',
      content: `
# Customer Support Policies

## Response Times
- Critical issues: < 1 hour
- High priority: < 4 hours
- Standard: < 24 hours

## Escalation
- Technical issues → Engineering team
- Billing disputes → Finance team
- Legal/compliance → Legal team

## SLA
- 99.9% uptime guarantee
- Monthly uptime reports available
- Compensation for SLA breaches
      `,
      filename: 'support-policies.txt',
      mime: 'text/plain',
      sizeBytes: 350,
      pageCount: 1,
      status: 'ready',
      published: true,
      companyId
    }
  ];

  for (const doc of documents) {
    await prisma.document.upsert({
      where: { id: doc.title },
      update: doc,
      create: doc
    });
  }
  console.log('✅ Documents created:', documents.length);

  const tickets = [
    {
      ticketNumber: 'TKT-001',
      subject: 'Order #ORD-001 not delivered',
      description: 'Customer reports order ORD-001 marked delivered but not received',
      status: 'open',
      priority: 'high',
      companyId
    },
    {
      ticketNumber: 'TKT-002',
      subject: 'Refund request for order #ORD-002',
      description: 'Customer wants refund for defective product received',
      status: 'in_progress',
      priority: 'medium',
      companyId
    },
    {
      ticketNumber: 'TKT-003',
      subject: 'Shipping address change for #ORD-003',
      description: 'Need to update shipping address before dispatch',
      status: 'resolved',
      priority: 'low',
      companyId
    },
    {
      ticketNumber: 'TKT-004',
      subject: 'Bulk order inquiry - 50+ units',
      description: 'Enterprise customer requesting volume pricing',
      status: 'open',
      priority: 'high',
      companyId
    }
  ];

  for (const ticket of tickets) {
    await prisma.ticket.upsert({
      where: { companyId_ticketNumber: { companyId, ticketNumber: ticket.ticketNumber } },
      update: {
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority
      },
      create: {
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        company: { connect: { id: companyId } }
      }
    });
  }
  console.log('✅ Tickets created:', tickets.length);

  const orders = [
    {
      orderNumber: 'ORD-001',
      customerEmail: 'customer1@example.com',
      total: 1299.99,
      status: 'delivered',
      trackingNumber: 'TRK-123456789',
      items: [
        { productId: 'mbp-14', name: 'MacBook Pro 14"', quantity: 1, price: 1999.99 }
      ],
      companyId
    },
    {
      orderNumber: 'ORD-002',
      customerEmail: 'customer2@example.com',
      total: 249.99,
      status: 'shipped',
      trackingNumber: 'TRK-987654321',
      items: [
        { productId: 'airpods-pro', name: 'AirPods Pro', quantity: 1, price: 249.99 }
      ],
      companyId
    },
    {
      orderNumber: 'ORD-003',
      customerEmail: 'customer3@example.com',
      total: 699.99,
      status: 'processing',
      items: [
        { productId: 'pixel-8', name: 'Google Pixel 8', quantity: 1, price: 699.99 }
      ],
      companyId
    },
    {
      orderNumber: 'ORD-004',
      customerEmail: 'customer4@example.com',
      total: 1499.99,
      status: 'pending',
      items: [
        { productId: 'xps-13', name: 'Dell XPS 13', quantity: 1, price: 1299.99 },
        { productId: 'usb-hub', name: 'USB-C Hub', quantity: 1, price: 79.99 }
      ],
      companyId
    }
  ];

  for (const order of orders) {
    await prisma.order.upsert({
      where: { companyId_orderNumber: { companyId, orderNumber: order.orderNumber } },
      update: {
        customerEmail: order.customerEmail,
        total: order.total,
        status: order.status,
        trackingNumber: order.trackingNumber,
        items: order.items
      },
      create: {
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        total: order.total,
        status: order.status,
        trackingNumber: order.trackingNumber,
        items: order.items,
        company: { connect: { id: companyId } }
      }
    });
  }
  console.log('✅ Orders created:', orders.length);

  const leads = [
    {
      name: 'John Smith',
      email: 'john@enterprise.com',
      phone: '+1-555-0101',
      source: 'website_chat',
      status: 'new',
      companyId
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah@techstart.io',
      phone: '+1-555-0102',
      source: 'widget',
      status: 'contacted',
      companyId
    },
    {
      name: 'Mike Wilson',
      email: 'mike@globaltech.com',
      phone: '+1-555-0103',
      source: 'referral',
      status: 'qualified',
      companyId
    },
    {
      name: 'Emily Chen',
      email: 'emily@innovation.io',
      phone: '+1-555-0104',
      source: 'website_chat',
      status: 'converted',
      companyId
    }
  ];

  for (const lead of leads) {
    await prisma.lead.create({
      data: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
        company: { connect: { id: companyId } }
      }
    });
  }
  console.log('✅ Leads created:', leads.length);

  const appointments = [
    {
      title: 'Product Demo - Acme Corp',
      notes: 'Demo of enterprise features for John Smith',
      startTime: new Date(Date.now() + 86400000),
      endTime: new Date(Date.now() + 86400000 + 1800000),
      status: 'scheduled',
      customerEmail: 'john@enterprise.com',
      customerName: 'John Smith',
      companyId
    },
    {
      title: 'Technical Consultation - TechStart',
      notes: 'Integration planning for Sarah Johnson',
      startTime: new Date(Date.now() + 172800000),
      endTime: new Date(Date.now() + 172800000 + 2700000),
      status: 'scheduled',
      customerEmail: 'sarah@techstart.io',
      customerName: 'Sarah Johnson',
      companyId
    },
    {
      title: 'Contract Review - GlobalTech',
      notes: 'Final contract review with Mike Wilson',
      startTime: new Date(Date.now() - 86400000),
      endTime: new Date(Date.now() - 86400000 + 3600000),
      status: 'completed',
      customerEmail: 'mike@globaltech.com',
      customerName: 'Mike Wilson',
      companyId
    }
  ];

  for (const apt of appointments) {
    await prisma.appointment.create({
      data: {
        title: apt.title,
        notes: apt.notes,
        startTime: apt.startTime,
        endTime: apt.endTime,
        status: apt.status,
        customerEmail: apt.customerEmail,
        customerName: apt.customerName,
        company: { connect: { id: companyId } }
      }
    });
  }
  console.log('✅ Appointments created:', appointments.length);

  const departments = [
    { name: 'General Support', description: 'General customer inquiries', companyId },
    { name: 'Technical Support', description: 'Technical issues and troubleshooting', companyId },
    { name: 'Billing', description: 'Billing and payment inquiries', companyId },
    { name: 'Sales', description: 'Pre-sales and enterprise inquiries', companyId }
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: `${companyId}-${dept.name.toLowerCase().replace(' ', '-')}` },
      update: { name: dept.name, description: dept.description, companyId },
      create: {
        id: `${companyId}-${dept.name.toLowerCase().replace(' ', '-')}`,
        name: dept.name,
        description: dept.description,
        companyId
      }
    });
  }
  console.log('✅ Departments created:', departments.length);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });