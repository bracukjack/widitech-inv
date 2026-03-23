import { v4 as uuidv4 } from 'uuid';
import { Client, Project, Expense, TimeLog, MeetingNote, Task } from '@/types';
import { useProjectStore } from './projectStore';
import { useClientStore } from './clientStore';
import { useFinanceStore } from './financeStore';
import { useTimeStore } from './timeStore';

const SEED_KEY = 'business-os-seeded';

const sd = { isDeleted: false as const, deletedAt: null as string | null };

function note(id: string, date: string, content: string, createdAt: string): MeetingNote {
  return { id, date, content, createdAt, ...sd };
}

function task(id: string, projectId: string, title: string, completed: boolean, priority: Task['priority'], createdAt: string): Task {
  return { id, projectId, title, completed, priority, createdAt, ...sd };
}

// Fixed IDs for referencing
const CLIENT_IDS = {
  budi: uuidv4(),
  sarah: uuidv4(),
  andi: uuidv4(),
};

const PROJECT_IDS = {
  majuJayaWeb: uuidv4(),
  sarahPortfolio: uuidv4(),
  digitalKreatifApp: uuidv4(),
  majuJayaMobile: uuidv4(),
  sarahPhotoshoot: uuidv4(),
  andiSoftware: uuidv4(),
};

function getSeedClients(): Client[] {
  return [
    {
      id: CLIENT_IDS.budi,
      name: 'Budi Santoso',
      company: 'PT Maju Jaya',
      email: 'budi@majujaya.co.id',
      phone: '+62 812-3456-7890',
      instagram: '@majujaya.id',
      address: 'Jl. Sudirman No. 45, Jakarta Selatan',
      rating: 5,
      notes: [
        note(uuidv4(), '2025-01-15', 'Meeting awal diskusi kebutuhan website company profile + e-commerce.', '2025-01-15T10:00:00Z'),
        note(uuidv4(), '2025-02-01', 'DP sudah dibayar 50%. Mulai development minggu depan.', '2025-02-01T14:00:00Z'),
      ],
      tags: ['repeat', 'pays on time'],
      createdAt: '2025-01-10T08:00:00Z',
      ...sd,
    },
    {
      id: CLIENT_IDS.sarah,
      name: 'Sarah Chen',
      company: '',
      email: 'sarah.chen@gmail.com',
      phone: '+62 821-9876-5432',
      address: 'Jl. Kemang Raya No. 12, Jakarta Selatan',
      rating: 4,
      notes: [
        note(uuidv4(), '2025-03-01', 'Butuh portfolio website untuk photography business.', '2025-03-01T09:00:00Z'),
      ],
      tags: ['referral'],
      createdAt: '2025-02-28T10:00:00Z',
      ...sd,
    },
    {
      id: CLIENT_IDS.andi,
      name: 'Andi Wijaya',
      company: 'CV Digital Kreatif',
      email: 'andi@digitalkreatif.com',
      phone: '+62 851-2345-6789',
      instagram: '@digitalkreatif',
      address: 'Jl. Gatot Subroto No. 78, Bandung',
      rating: 3,
      notes: [
        note(uuidv4(), '2025-02-10', 'Request mobile app untuk internal inventory management.', '2025-02-10T11:00:00Z'),
        note(uuidv4(), '2025-03-20', 'Revisi UI ke-3. Client cukup demanding tapi scope jelas.', '2025-03-20T16:00:00Z'),
      ],
      tags: ['difficult'],
      createdAt: '2025-02-05T08:00:00Z',
      ...sd,
    },
  ];
}

function getSeedProjects(): Project[] {
  const now = new Date().toISOString();
  return [
    {
      id: PROJECT_IDS.majuJayaWeb, name: 'Company Profile & E-commerce', clientId: CLIENT_IDS.budi, category: 'web_dev', status: 'in_progress',
      description: 'Website company profile with integrated e-commerce for PT Maju Jaya building materials.',
      progress: 65, contractValue: 25000000, dpAmount: 12500000, dpPaid: true, dpPaidDate: '2025-02-01', finalPaid: false,
      startDate: '2025-02-05', deadline: '2025-04-15',
      tasks: [
        task(uuidv4(), PROJECT_IDS.majuJayaWeb, 'Design mockup homepage', true, 'high', now),
        task(uuidv4(), PROJECT_IDS.majuJayaWeb, 'Implement product catalog', true, 'high', now),
        task(uuidv4(), PROJECT_IDS.majuJayaWeb, 'Shopping cart & checkout', false, 'high', now),
        task(uuidv4(), PROJECT_IDS.majuJayaWeb, 'Payment gateway integration', false, 'medium', now),
        task(uuidv4(), PROJECT_IDS.majuJayaWeb, 'Admin dashboard', false, 'medium', now),
      ],
      notes: 'Using Next.js + Supabase. Client wants Midtrans payment gateway.',
      attachments: ['wireframe-v2.fig', 'brand-guidelines.pdf'], hourlyRate: 150000, estimatedHours: 160, createdAt: '2025-01-20T08:00:00Z', updatedAt: now, ...sd,
    },
    {
      id: PROJECT_IDS.sarahPortfolio, name: 'Photography Portfolio Website', clientId: CLIENT_IDS.sarah, category: 'web_dev', status: 'revision',
      description: 'Minimalist photography portfolio with gallery and booking integration.',
      progress: 85, contractValue: 8000000, dpAmount: 4000000, dpPaid: true, dpPaidDate: '2025-03-05', finalPaid: false,
      startDate: '2025-03-10', deadline: '2025-04-01',
      tasks: [
        task(uuidv4(), PROJECT_IDS.sarahPortfolio, 'Gallery layout', true, 'high', now),
        task(uuidv4(), PROJECT_IDS.sarahPortfolio, 'Contact form', true, 'medium', now),
        task(uuidv4(), PROJECT_IDS.sarahPortfolio, 'Revisi - gallery transition effect', false, 'high', now),
      ],
      notes: 'Client wants smooth gallery transitions. Revision #1.', attachments: ['photo-samples.zip'],
      createdAt: '2025-03-01T09:00:00Z', updatedAt: now, ...sd,
    },
    {
      id: PROJECT_IDS.digitalKreatifApp, name: 'Inventory Management App', clientId: CLIENT_IDS.andi, category: 'mobile_app', status: 'revision',
      description: 'Cross-platform mobile app for inventory management using React Native.',
      progress: 70, contractValue: 18000000, dpAmount: 9000000, dpPaid: true, dpPaidDate: '2025-02-15', finalPaid: false,
      startDate: '2025-02-20', deadline: '2025-04-30',
      tasks: [
        task(uuidv4(), PROJECT_IDS.digitalKreatifApp, 'Item CRUD module', true, 'high', now),
        task(uuidv4(), PROJECT_IDS.digitalKreatifApp, 'Barcode scanner', true, 'high', now),
        task(uuidv4(), PROJECT_IDS.digitalKreatifApp, 'Reporting dashboard', false, 'medium', now),
        task(uuidv4(), PROJECT_IDS.digitalKreatifApp, 'UI revision - client feedback', false, 'high', now),
      ],
      notes: 'React Native + Firebase. Third UI revision round.', attachments: ['app-spec-v3.pdf'], hourlyRate: 200000, estimatedHours: 100,
      createdAt: '2025-02-10T11:00:00Z', updatedAt: now, ...sd,
    },
    {
      id: PROJECT_IDS.majuJayaMobile, name: 'Mobile Catalog App', clientId: CLIENT_IDS.budi, category: 'mobile_app', status: 'negotiation',
      description: 'Mobile companion app for the e-commerce website - product browsing and order tracking.',
      progress: 0, contractValue: 15000000, dpAmount: 7500000, dpPaid: false, finalPaid: false,
      startDate: '2025-05-01', deadline: '2025-07-01', tasks: [],
      notes: 'Fase 2 dari project web. Menunggu website selesai dulu.', attachments: [],
      createdAt: '2025-03-15T10:00:00Z', updatedAt: now, ...sd,
    },
    {
      id: PROJECT_IDS.sarahPhotoshoot, name: 'Product Photography Session', clientId: CLIENT_IDS.sarah, category: 'photography', status: 'done',
      description: 'Product photography for Sarah\'s handmade jewelry collection - 50 items.',
      progress: 100, contractValue: 5000000, dpAmount: 2500000, dpPaid: true, dpPaidDate: '2025-01-05', finalPaid: true, finalPaidDate: '2025-01-25',
      startDate: '2025-01-10', deadline: '2025-01-20', deliveredDate: '2025-01-18',
      tasks: [
        task(uuidv4(), PROJECT_IDS.sarahPhotoshoot, 'Setup studio', true, 'high', now),
        task(uuidv4(), PROJECT_IDS.sarahPhotoshoot, 'Shoot 50 items', true, 'high', now),
        task(uuidv4(), PROJECT_IDS.sarahPhotoshoot, 'Post-processing', true, 'medium', now),
      ],
      notes: 'Delivered early. Client very happy.', attachments: ['deliverables.zip'],
      createdAt: '2025-01-02T08:00:00Z', updatedAt: '2025-01-25T10:00:00Z', ...sd,
    },
    {
      id: PROJECT_IDS.andiSoftware, name: 'POS System Desktop App', clientId: CLIENT_IDS.andi, category: 'software', status: 'lead',
      description: 'Point-of-sale desktop application with receipt printing and daily reports.',
      progress: 0, contractValue: 20000000, dpAmount: 10000000, dpPaid: false, finalPaid: false,
      startDate: '2025-06-01', deadline: '2025-09-01', tasks: [],
      notes: 'Initial inquiry. Sending proposal next week.', attachments: [],
      createdAt: '2025-03-18T14:00:00Z', updatedAt: now, ...sd,
    },
  ];
}

function getSeedExpenses(): Expense[] {
  return [
    { id: uuidv4(), category: 'software', description: 'Vercel Pro subscription', amount: 300000, date: '2025-01-05', createdAt: '2025-01-05T08:00:00Z', ...sd },
    { id: uuidv4(), category: 'software', description: 'Figma Professional', amount: 200000, date: '2025-01-10', createdAt: '2025-01-10T08:00:00Z', ...sd },
    { id: uuidv4(), category: 'hardware', description: 'Mechanical keyboard', amount: 1500000, date: '2025-02-15', createdAt: '2025-02-15T08:00:00Z', ...sd },
    { id: uuidv4(), category: 'operational', description: 'Internet bill January', amount: 500000, date: '2025-01-25', createdAt: '2025-01-25T08:00:00Z', ...sd },
    { id: uuidv4(), category: 'education', description: 'React Native Masterclass course', amount: 750000, date: '2025-02-20', createdAt: '2025-02-20T08:00:00Z', ...sd },
  ];
}

function getSeedTimeLogs(): TimeLog[] {
  return [
    { id: uuidv4(), projectId: PROJECT_IDS.majuJayaWeb, description: 'Homepage mockup design', startTime: '2025-02-05T09:00:00Z', endTime: '2025-02-05T12:00:00Z', duration: 180, billable: true, hourlyRate: 150000, billableAmount: 450000, createdAt: '2025-02-05T12:00:00Z', ...sd },
    { id: uuidv4(), projectId: PROJECT_IDS.majuJayaWeb, description: 'Product catalog implementation', startTime: '2025-02-06T09:00:00Z', endTime: '2025-02-06T15:00:00Z', duration: 360, billable: true, hourlyRate: 150000, billableAmount: 900000, createdAt: '2025-02-06T15:00:00Z', ...sd },
    { id: uuidv4(), projectId: PROJECT_IDS.majuJayaWeb, description: 'Shopping cart feature', startTime: '2025-02-10T10:00:00Z', endTime: '2025-02-10T14:00:00Z', duration: 240, billable: true, hourlyRate: 150000, billableAmount: 600000, createdAt: '2025-02-10T14:00:00Z', ...sd },
    { id: uuidv4(), projectId: PROJECT_IDS.sarahPortfolio, description: 'Gallery layout design', startTime: '2025-03-10T09:00:00Z', endTime: '2025-03-10T13:00:00Z', duration: 240, billable: true, hourlyRate: 100000, billableAmount: 400000, createdAt: '2025-03-10T13:00:00Z', ...sd },
    { id: uuidv4(), projectId: PROJECT_IDS.sarahPortfolio, description: 'Contact form & responsive', startTime: '2025-03-12T10:00:00Z', endTime: '2025-03-12T12:00:00Z', duration: 120, billable: true, hourlyRate: 100000, billableAmount: 200000, createdAt: '2025-03-12T12:00:00Z', ...sd },
    { id: uuidv4(), projectId: PROJECT_IDS.digitalKreatifApp, description: 'Item CRUD module', startTime: '2025-02-20T08:00:00Z', endTime: '2025-02-20T14:00:00Z', duration: 360, billable: true, hourlyRate: 200000, billableAmount: 1200000, createdAt: '2025-02-20T14:00:00Z', ...sd },
    { id: uuidv4(), projectId: PROJECT_IDS.digitalKreatifApp, description: 'Barcode scanner integration', startTime: '2025-02-22T09:00:00Z', endTime: '2025-02-22T13:00:00Z', duration: 240, billable: true, hourlyRate: 200000, billableAmount: 800000, createdAt: '2025-02-22T13:00:00Z', ...sd },
    { id: uuidv4(), projectId: PROJECT_IDS.digitalKreatifApp, description: 'Bug fixes & testing', startTime: '2025-03-01T10:00:00Z', endTime: '2025-03-01T12:00:00Z', duration: 120, billable: false, hourlyRate: 200000, billableAmount: 0, createdAt: '2025-03-01T12:00:00Z', ...sd },
    { id: uuidv4(), projectId: PROJECT_IDS.sarahPhotoshoot, description: 'Product photography - batch 1', startTime: '2025-01-10T08:00:00Z', endTime: '2025-01-10T16:00:00Z', duration: 480, billable: true, hourlyRate: 100000, billableAmount: 800000, createdAt: '2025-01-10T16:00:00Z', ...sd },
    { id: uuidv4(), projectId: PROJECT_IDS.sarahPhotoshoot, description: 'Photo editing & retouching', startTime: '2025-01-15T09:00:00Z', endTime: '2025-01-15T17:00:00Z', duration: 480, billable: true, hourlyRate: 100000, billableAmount: 800000, createdAt: '2025-01-15T17:00:00Z', ...sd },
  ];
}

export function seedAllData() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SEED_KEY)) return;

  const clients = getSeedClients();
  const projects = getSeedProjects();
  const expenses = getSeedExpenses();
  const timeLogs = getSeedTimeLogs();

  // Seed into stores
  useClientStore.setState({ clients });
  useProjectStore.setState({ projects });
  useFinanceStore.setState({ expenses });
  useTimeStore.setState({ timeLogs });

  localStorage.setItem(SEED_KEY, 'true');
}
