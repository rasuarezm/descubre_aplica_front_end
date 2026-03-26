import type { Customer, Opportunity, DocumentItem, CustomerDocument } from '@/types';

export let mockCustomers: Customer[] = [
  { id: 'cust_1', name: 'Innovatech Solutions', profileInfo: 'Tech startup, 50 employees, 2 years in market, focusing on SaaS products.', logoUrl: 'https://placehold.co/80x80.png?text=IS' },
  { id: 'cust_2', name: 'BuildWell Constructions', profileInfo: 'Established construction firm, 500+ employees, 25 years experience, specializing in public infrastructure.', logoUrl: 'https://placehold.co/80x80.png?text=BC' },
  { id: 'cust_3', name: 'GreenLeaf Organics', profileInfo: 'Mid-sized agricultural company, 150 employees, 10 years in organic farming, seeking export grants.', logoUrl: 'https://placehold.co/80x80.png?text=GO' },
];

export let mockOpportunities: Opportunity[] = [
  { 
    id: 'opp_1', 
    customerId: 'cust_1', 
    title: 'GovTech Grant Application', 
    description: 'Application for a government grant to develop a new civic tech platform.',
    requirements: 'Requires detailed project proposal, financial statements for last 2 years, team CVs, and a prototype demonstration. Deadline: 2024-12-31.',
    deadline: new Date('2024-12-31'),
    status: 'open',
  },
  { 
    id: 'opp_2', 
    customerId: 'cust_1', 
    title: 'AI Innovation Challenge', 
    description: 'Participate in an AI innovation challenge for enterprise solutions.',
    requirements: 'Solution whitepaper, technical architecture, company registration, pitch deck. Deadline: 2024-11-15.',
    deadline: new Date('2024-11-15'),
    status: 'draft',
  },
  { 
    id: 'opp_3', 
    customerId: 'cust_2', 
    title: 'Public Library Construction Bid', 
    description: 'Bid for the construction of a new central public library.',
    requirements: 'Company portfolio, safety certifications (ISO 45001), environmental plan, proof of insurance, detailed budget breakdown. Deadline: 2025-03-01.',
    deadline: new Date('2025-03-01'),
    status: 'open',
  },
];

export let mockDocumentItems: DocumentItem[] = [
  { 
    id: 'doc_1_1', 
    opportunityId: 'opp_1', 
    name: 'Project Proposal', 
    description: 'Detailed outline of the proposed civic tech platform.', 
    status: 'pending' 
  },
  { 
    id: 'doc_1_2', 
    opportunityId: 'opp_1', 
    name: 'Financial Statements (Year 1)', 
    description: 'Audited financial statements for the first year of operation.', 
    status: 'uploaded', 
    fileUrl: '/documents/financials_y1.pdf',
    fileName: 'financials_y1.pdf',
    uploadedAt: new Date('2024-07-10')
  },
  { 
    id: 'doc_1_3', 
    opportunityId: 'opp_1', 
    name: 'Financial Statements (Year 2)', 
    description: 'Audited financial statements for the second year of operation.', 
    status: 'pending' 
  },
  { 
    id: 'doc_1_4', 
    opportunityId: 'opp_1', 
    name: 'Team CVs', 
    description: 'Curriculum Vitae of key team members.', 
    status: 'approved',
    fileUrl: '/documents/team_cvs.zip',
    fileName: 'team_cvs.zip',
    uploadedAt: new Date('2024-07-15')
  },
  { 
    id: 'doc_3_1', 
    opportunityId: 'opp_3', 
    name: 'Company Portfolio', 
    description: 'Showcase of previous construction projects.', 
    status: 'pending' 
  },
  { 
    id: 'doc_3_2', 
    opportunityId: 'opp_3', 
    name: 'ISO 45001 Certification', 
    description: 'Valid Occupational Health and Safety certification.', 
    status: 'uploaded',
    fileUrl: '/documents/iso_45001.pdf',
    fileName: 'iso_45001.pdf',
    uploadedAt: new Date('2024-07-20')
  },
];

export let mockCustomerDocuments: CustomerDocument[] = [
    { id: 'cdoc_1', customerId: 'cust_1', category: 'financial_rup', name: 'Company Bylaws', description: 'Official corporate bylaws document.', status: 'verified', fileUrl: '/docs/bylaws.pdf', fileName: 'bylaws.pdf' },
    { id: 'cdoc_2', customerId: 'cust_1', category: 'experience', name: 'SaaS Project Case Study', description: 'A detailed case study of a major project.', status: 'uploaded', fileUrl: '/docs/saas_casestudy.pdf', fileName: 'saas_casestudy.pdf' },
    { id: 'cdoc_3', customerId: 'cust_2', category: 'experience', name: 'Bridge Construction Portfolio', description: 'Portfolio of all bridge projects from 2015-2020.', status: 'verified', fileUrl: '/docs/bridge_portfolio.pdf', fileName: 'bridge_portfolio.pdf' },
    { id: 'cdoc_4', customerId: 'cust_2', category: 'financial_rup', name: 'R.U.P. Certificate 2024', description: 'Registro Único de Proponentes updated for the current year.', status: 'uploaded', fileUrl: '/docs/rup_2024.pdf', fileName: 'rup_2024.pdf' },
    { id: 'cdoc_5', customerId: 'cust_2', category: 'financial_rup', name: 'Audited Financials 2023', description: 'Complete audited financial statements for fiscal year 2023.', status: 'uploaded', fileUrl: '/docs/financials_2023.pdf', fileName: 'financials_2023.pdf' },
    { id: 'cdoc_6', customerId: 'cust_2', category: 'other', name: 'Proof of Insurance', description: 'General liability insurance certificate.', status: 'pending' },
];


// Helper functions to get mock data
export const getCustomerById = (id: string): Customer | undefined => mockCustomers.find(c => c.id === id);
export const getOpportunitiesByCustomerId = (customerId: string): Opportunity[] => mockOpportunities.filter(o => o.customerId === customerId);
export const getOpportunityById = (id: string): Opportunity | undefined => mockOpportunities.find(o => o.id === id);
export const getDocumentItemsByOpportunityId = (opportunityId: string): DocumentItem[] => mockDocumentItems.filter(d => d.opportunityId === opportunityId);
export const getCustomerDocumentsByCustomerId = (customerId: string): CustomerDocument[] => mockCustomerDocuments.filter(d => d.customerId === customerId);
