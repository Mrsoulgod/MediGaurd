import { Location, Medicine, Supplier, Batch, StockBalance, UserProfile, RuleConfig, SharedMedicineListing } from '../schemas';

export const SEED_LOCATIONS: Location[] = [
  {
    id: 'LOC-CENTRAL',
    name: 'Central Pharmacy',
    type: 'CENTRAL_PHARMACY',
    storageCapabilities: ['AMBIENT', 'COLD_CHAIN', 'CONTROLLED_SUBSTANCE'],
    active: true,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'LOC-ICU',
    name: 'Intensive Care Unit (ICU)',
    type: 'ICU',
    storageCapabilities: ['AMBIENT', 'COLD_CHAIN'],
    active: true,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'LOC-EMERGENCY',
    name: 'Emergency Department (ED)',
    type: 'EMERGENCY',
    storageCapabilities: ['AMBIENT'],
    active: true,
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'LOC-PEDIATRICS',
    name: 'Pediatrics Ward',
    type: 'PEDIATRICS',
    storageCapabilities: ['AMBIENT'],
    active: true,
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'LOC-OT',
    name: 'OT Satellite Store',
    type: 'OT_SATELLITE',
    storageCapabilities: ['AMBIENT'],
    active: true,
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=500&auto=format&fit=crop&q=80',
  },
];

export const SEED_SUPPLIERS: Supplier[] = [
  {
    id: 'SUP-CIPLA',
    name: 'Cipla Therapeutics Ltd.',
    leadTimeDays: 4,
    acceptsReturns: true,
    returnWindowDays: 45,
    contactEmail: 'institutional.orders@cipla.med',
    phone: '+91 22 2482 6000',
    logo: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'SUP-SUN',
    name: 'Sun Pharma Lifecare',
    leadTimeDays: 5,
    acceptsReturns: false,
    returnWindowDays: 0,
    contactEmail: 'hospital.sales@sunpharma.com',
    phone: '+91 22 4324 4324',
    logo: 'https://images.unsplash.com/photo-1563213126-a4273aed2016?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'SUP-REDDY',
    name: "Dr. Reddy's Laboratories",
    leadTimeDays: 3,
    acceptsReturns: false,
    returnWindowDays: 0,
    contactEmail: 'institutional@drreddys.com',
    phone: '+91 40 4900 2900',
    logo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'SUP-BIOCON',
    name: 'Biocon Biologics ColdChain',
    leadTimeDays: 6,
    acceptsReturns: false,
    returnWindowDays: 0,
    contactEmail: 'coldchain.care@biocon.com',
    phone: '+91 80 2808 2808',
    logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=100&auto=format&fit=crop&q=80',
  },
];

export const SEED_MEDICINES: Medicine[] = [
  {
    id: 'MED-01',
    sku: 'MED-CTX-1G',
    genericName: 'Ceftriaxone 1g IV Injection',
    brandName: 'Monocef',
    category: 'Antibiotics',
    unit: 'vial',
    unitCostPaise: 14500, // ₹145.00
    criticality: 'HIGH',
    storageRequirement: 'AMBIENT',
    packageSize: 10,
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&auto=format&fit=crop&q=80',
    active: true,
  },
  {
    id: 'MED-02',
    sku: 'MED-MERO-1G',
    genericName: 'Meropenem 1g IV Injection',
    brandName: 'Meronem',
    category: 'Reserve Antibiotics',
    unit: 'vial',
    unitCostPaise: 85000, // ₹850.00
    criticality: 'HIGH',
    storageRequirement: 'AMBIENT',
    packageSize: 5,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
    active: true,
  },
  {
    id: 'MED-03',
    sku: 'MED-INS-GLAR',
    genericName: 'Insulin Glargine 100 IU/ml 3ml',
    brandName: 'Lantus',
    category: 'Endocrinology / Critical',
    unit: 'cartridge',
    unitCostPaise: 68000, // ₹680.00
    criticality: 'HIGH',
    storageRequirement: 'COLD_CHAIN',
    packageSize: 5,
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&auto=format&fit=crop&q=80',
    active: true,
  },
  {
    id: 'MED-04',
    sku: 'MED-ENOX-40',
    genericName: 'Enoxaparin Sodium 40mg/0.4ml',
    brandName: 'Clexane',
    category: 'Anticoagulants',
    unit: 'syringe',
    unitCostPaise: 42000, // ₹420.00
    criticality: 'HIGH',
    storageRequirement: 'COLD_CHAIN',
    packageSize: 2,
    image: 'https://images.unsplash.com/photo-1579165466791-78818925567b?w=400&auto=format&fit=crop&q=80',
    active: true,
  },
  {
    id: 'MED-05',
    sku: 'MED-PANTO-40',
    genericName: 'Pantoprazole 40mg IV Injection',
    brandName: 'Pan-IV',
    category: 'Gastrointestinal',
    unit: 'vial',
    unitCostPaise: 5500, // ₹55.00
    criticality: 'MEDIUM',
    storageRequirement: 'AMBIENT',
    packageSize: 10,
    image: 'https://images.unsplash.com/photo-1550572017-ed236c535e69?w=400&auto=format&fit=crop&q=80',
    active: true,
  },
  {
    id: 'MED-06',
    sku: 'MED-PCM-650',
    genericName: 'Paracetamol 650mg Tablets',
    brandName: 'Dolo 650',
    category: 'Analgesics & Antipyretics',
    unit: 'strip',
    unitCostPaise: 3200, // ₹32.00
    criticality: 'LOW',
    storageRequirement: 'AMBIENT',
    packageSize: 15,
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&auto=format&fit=crop&q=80',
    active: true,
  },
  {
    id: 'MED-07',
    sku: 'MED-AMX-CLAV',
    genericName: 'Amoxicillin + Clavulanate 625mg',
    brandName: 'Augmentin',
    category: 'Antibiotics',
    unit: 'strip',
    unitCostPaise: 19800, // ₹198.00
    criticality: 'MEDIUM',
    storageRequirement: 'AMBIENT',
    packageSize: 10,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&auto=format&fit=crop&q=80',
    active: true,
  },
  {
    id: 'MED-08',
    sku: 'MED-NS-500',
    genericName: 'Normal Saline 0.9% IV 500ml',
    brandName: 'NS Infusion',
    category: 'IV Fluids',
    unit: 'bottle',
    unitCostPaise: 4200, // ₹42.00
    criticality: 'HIGH',
    storageRequirement: 'AMBIENT',
    packageSize: 24,
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&auto=format&fit=crop&q=80',
    active: true,
  },
  {
    id: 'MED-09',
    sku: 'MED-OND-4',
    genericName: 'Ondansetron 4mg/2ml Injection',
    brandName: 'Emeset',
    category: 'Antiemetics',
    unit: 'ampoule',
    unitCostPaise: 2800, // ₹28.00
    criticality: 'MEDIUM',
    storageRequirement: 'AMBIENT',
    packageSize: 10,
    image: 'https://images.unsplash.com/photo-1550572017-ed236c535e69?w=400&auto=format&fit=crop&q=80',
    active: true,
  },
  {
    id: 'MED-10',
    sku: 'MED-PIPTAZ-45',
    genericName: 'Piperacillin + Tazobactam 4.5g',
    brandName: 'Pipzo',
    category: 'Reserve Antibiotics',
    unit: 'vial',
    unitCostPaise: 49500, // ₹495.00
    criticality: 'HIGH',
    storageRequirement: 'AMBIENT',
    packageSize: 1,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
    active: true,
  },
  {
    id: 'MED-11',
    sku: 'MED-ADR-1',
    genericName: 'Adrenaline 1mg/ml Injection',
    brandName: 'Vasocon',
    category: 'Emergency Resuscitation',
    unit: 'ampoule',
    unitCostPaise: 3500, // ₹35.00
    criticality: 'HIGH',
    storageRequirement: 'AMBIENT',
    packageSize: 10,
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&auto=format&fit=crop&q=80',
    active: true,
  },
  {
    id: 'MED-12',
    sku: 'MED-NOR-4',
    genericName: 'Noradrenaline 4mg/2ml Infusion',
    brandName: 'Norad',
    category: 'Vasopressors',
    unit: 'ampoule',
    unitCostPaise: 18500, // ₹185.00
    criticality: 'HIGH',
    storageRequirement: 'AMBIENT',
    packageSize: 5,
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&auto=format&fit=crop&q=80',
    active: true,
  },
];

export const SEED_BATCHES: Batch[] = [
  // --- HERO SCENARIO 1: Central Pharmacy Ceftriaxone surplus vs ICU shortage ---
  // Central Pharmacy has 400 units, expires in 25 days (2026-11-18 relative to 2026-10-24).
  // Central uses ~5 units/day -> ~125 consumed, leaving ~275 projected unused!
  {
    id: 'BATCH-CTX-HERO',
    medicineId: 'MED-01',
    supplierId: 'SUP-CIPLA',
    batchCode: 'CTX-2026-HERO',
    expiresOn: '2026-11-18', // +25 days
    unitCostPaise: 14500,
    receivedOn: '2025-11-18',
    status: 'ACTIVE',
    qrCode: 'QR-CTX-2026-HERO',
  },
  // ICU has 24 units of Ceftriaxone batch expiring in 40 days, but ICU uses 4 units/day (runs out in 6 days < 7d lead+safe!)
  {
    id: 'BATCH-CTX-ICU-SHORT',
    medicineId: 'MED-01',
    supplierId: 'SUP-CIPLA',
    batchCode: 'CTX-2026-088B',
    expiresOn: '2026-12-05', // +42 days
    unitCostPaise: 14500,
    receivedOn: '2025-12-05',
    status: 'ACTIVE',
    qrCode: 'QR-CTX-2026-088B',
  },

  // --- HERO SCENARIO 2: Physical Count Discrepancy & Stale Record (Meropenem) ---
  {
    id: 'BATCH-MERO-STALE',
    medicineId: 'MED-02',
    supplierId: 'SUP-SUN',
    batchCode: 'MERO-2026-STALE',
    expiresOn: '2026-11-05', // +12 days
    unitCostPaise: 85000,
    receivedOn: '2025-11-05',
    status: 'ACTIVE',
    qrCode: 'QR-MERO-2026-STALE',
  },

  // --- HERO SCENARIO 3: Cold-Chain Critical Stockout Alert (Insulin Glargine) ---
  {
    id: 'BATCH-INS-URGENT',
    medicineId: 'MED-03',
    supplierId: 'SUP-BIOCON',
    batchCode: 'INS-2026-COLD',
    expiresOn: '2026-12-25', // +62 days
    unitCostPaise: 68000,
    receivedOn: '2026-01-10',
    status: 'ACTIVE',
    qrCode: 'QR-INS-2026-COLD',
  },

  // --- REQUIRED TEST CASE: Already Expired Batch ---
  {
    id: 'BATCH-EXPIRED-PCM',
    medicineId: 'MED-06',
    supplierId: 'SUP-REDDY',
    batchCode: 'PCM-2024-EXP',
    expiresOn: '2026-10-18', // -6 days ago -> EXPIRED
    unitCostPaise: 3200,
    receivedOn: '2023-10-18',
    status: 'EXPIRED',
    qrCode: 'QR-PCM-2024-EXP',
  },

  // --- REQUIRED TEST CASE: Blocked / Recalled Batch ---
  {
    id: 'BATCH-RECALL-PIPTAZ',
    medicineId: 'MED-10',
    supplierId: 'SUP-CIPLA',
    batchCode: 'PIPTAZ-RECALL-9',
    expiresOn: '2027-05-15',
    unitCostPaise: 49500,
    receivedOn: '2025-05-15',
    status: 'RECALLED',
    qrCode: 'QR-PIPTAZ-RECALL-9',
  },

  // Additional realistic batches across locations
  {
    id: 'BATCH-PANTO-1',
    medicineId: 'MED-05',
    supplierId: 'SUP-SUN',
    batchCode: 'PAN-2025-101',
    expiresOn: '2026-11-15', // +22 days
    unitCostPaise: 5500,
    receivedOn: '2024-11-15',
    status: 'ACTIVE',
  },
  {
    id: 'BATCH-PANTO-2',
    medicineId: 'MED-05',
    supplierId: 'SUP-SUN',
    batchCode: 'PAN-2026-202',
    expiresOn: '2027-04-10',
    unitCostPaise: 5500,
    receivedOn: '2025-04-10',
    status: 'ACTIVE',
  },
  {
    id: 'BATCH-NS-1',
    medicineId: 'MED-08',
    supplierId: 'SUP-CIPLA',
    batchCode: 'NS-2025-900',
    expiresOn: '2027-08-20',
    unitCostPaise: 4200,
    receivedOn: '2025-08-20',
    status: 'ACTIVE',
  },
  {
    id: 'BATCH-ENOX-1',
    medicineId: 'MED-04',
    supplierId: 'SUP-SUN',
    batchCode: 'ENOX-2026-114',
    expiresOn: '2026-11-20', // +27 days
    unitCostPaise: 42000,
    receivedOn: '2025-11-20',
    status: 'ACTIVE',
  },
  {
    id: 'BATCH-ADR-1',
    medicineId: 'MED-11',
    supplierId: 'SUP-CIPLA',
    batchCode: 'ADR-2026-301',
    expiresOn: '2026-11-10', // +17 days
    unitCostPaise: 3500,
    receivedOn: '2025-11-10',
    status: 'ACTIVE',
  },
  {
    id: 'BATCH-NOR-1',
    medicineId: 'MED-12',
    supplierId: 'SUP-REDDY',
    batchCode: 'NOR-2026-405',
    expiresOn: '2027-02-15',
    unitCostPaise: 18500,
    receivedOn: '2025-02-15',
    status: 'ACTIVE',
  },
];

export const SEED_BALANCES: StockBalance[] = [
  // Central Pharmacy hero batch: 400 units
  { batchId: 'BATCH-CTX-HERO', locationId: 'LOC-CENTRAL', quantity: 400, version: 1 },
  // ICU shortage batch: only 24 units
  { batchId: 'BATCH-CTX-ICU-SHORT', locationId: 'LOC-ICU', quantity: 24, version: 1 },
  // Meropenem in Emergency: 85 units with discrepancy
  { batchId: 'BATCH-MERO-STALE', locationId: 'LOC-EMERGENCY', quantity: 85, version: 1 },
  // Insulin Glargine in Central Pharmacy: 12 units (stockout inside lead time!)
  { batchId: 'BATCH-INS-URGENT', locationId: 'LOC-CENTRAL', quantity: 12, version: 1 },
  // Expired batch in Pediatrics: 50 units
  { batchId: 'BATCH-EXPIRED-PCM', locationId: 'LOC-PEDIATRICS', quantity: 50, version: 1 },
  // Recalled batch in Central: 30 units
  { batchId: 'BATCH-RECALL-PIPTAZ', locationId: 'LOC-CENTRAL', quantity: 30, version: 1 },
  // Pantoprazole batches
  { batchId: 'BATCH-PANTO-1', locationId: 'LOC-CENTRAL', quantity: 60, version: 1 },
  { batchId: 'BATCH-PANTO-2', locationId: 'LOC-CENTRAL', quantity: 150, version: 1 },
  // Normal Saline in Central: 300 bottles
  { batchId: 'BATCH-NS-1', locationId: 'LOC-CENTRAL', quantity: 300, version: 1 },
  // Enoxaparin in ICU: 18 syringes
  { batchId: 'BATCH-ENOX-1', locationId: 'LOC-ICU', quantity: 18, version: 1 },
  // Adrenaline in Emergency: 15 ampoules
  { batchId: 'BATCH-ADR-1', locationId: 'LOC-EMERGENCY', quantity: 15, version: 1 },
  // Noradrenaline in ICU: 20 ampoules
  { batchId: 'BATCH-NOR-1', locationId: 'LOC-ICU', quantity: 20, version: 1 },
];

export const SEED_USERS: UserProfile[] = [
  // --- Profile Type 1: Hospital Pharmacy & Inpatient Health System ---
  {
    id: 'USER-HOSPITAL-PHARMACY',
    name: 'Dr. Vikram Malhotra',
    role: 'SUPER_ADMIN',
    assignedLocationId: 'LOC-CENTRAL',
    email: 'pharmacy@apollohealth.org',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
    departmentTitle: 'Hospital Pharmacy Director & Inpatient Formulary Head',
    employeeId: 'APO-DIR-001',
    phone: '+91 98110 44210',
    facilityType: 'HOSPITAL_PHARMACY',
    facilityName: 'Apollo Institute of Medical Sciences (Central Hospital)',
    storeArea: 'Main Hospital Complex, Sector 26',
    drugLicenseNo: 'HOSP-DL-01/2026',
    active: true,
  },

  // --- Profile Type 2: Local Medical Store Owners (Retail Chemists) ---
  {
    id: 'USER-LOCAL-RAMESH',
    name: 'Ramesh Patel',
    role: 'STAFF',
    assignedLocationId: 'LOC-CENTRAL',
    email: 'ramesh@carepluschemist.in',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    departmentTitle: 'Registered Pharmacist & Store Owner',
    employeeId: 'RET-OWN-101',
    phone: '+91 98220 77112',
    facilityType: 'LOCAL_PHARMACY',
    facilityName: 'CarePlus Chemist & Druggist',
    storeArea: 'Market Road, Sector 14, Gurugram',
    drugLicenseNo: 'DL-20B-184920',
    active: true,
  },
  {
    id: 'USER-LOCAL-SURESH',
    name: 'Suresh Sharma',
    role: 'STAFF',
    assignedLocationId: 'LOC-CENTRAL',
    email: 'suresh@sharmamedical.in',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    departmentTitle: 'Retail Chemist & Proprietor',
    employeeId: 'RET-OWN-102',
    phone: '+91 98110 33412',
    facilityType: 'LOCAL_PHARMACY',
    facilityName: 'Sharma Medical & General Store',
    storeArea: 'Main Commercial Belt, Model Town, Delhi',
    drugLicenseNo: 'DL-20B-553190',
    active: true,
  },
  {
    id: 'USER-LOCAL-POOJA',
    name: 'Pooja Iyer',
    role: 'STAFF',
    assignedLocationId: 'LOC-CENTRAL',
    email: 'pooja.iyer@cyberhubpharmacy.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    departmentTitle: 'Franchise Partner & Lead Pharmacist',
    employeeId: 'RET-OWN-103',
    phone: '+91 98711 88320',
    facilityType: 'LOCAL_PHARMACY',
    facilityName: 'Apollo Pharmacy CyberHub Franchise',
    storeArea: 'Building 10, DLF Cyber City, Phase 3',
    drugLicenseNo: 'DL-20B-998241',
    active: true,
  },
  {
    id: 'USER-LOCAL-AMIT',
    name: 'Amit Verma',
    role: 'STAFF',
    assignedLocationId: 'LOC-CENTRAL',
    email: 'amit@citymed24x7.com',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80',
    departmentTitle: 'Owner & 24x7 Emergency Chemist',
    employeeId: 'RET-OWN-104',
    phone: '+91 98331 44556',
    facilityType: 'LOCAL_PHARMACY',
    facilityName: 'CityMed 24x7 Chemist & Druggist',
    storeArea: 'Old Railway Road, Gurugram',
    drugLicenseNo: 'DL-20B-441203',
    active: true,
  },
  {
    id: 'USER-LOCAL-VIKRAM',
    name: 'Vikram Singh',
    role: 'STAFF',
    assignedLocationId: 'LOC-CENTRAL',
    email: 'vikram@sanjivanimedicos.in',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
    departmentTitle: 'Managing Partner & Druggist',
    employeeId: 'RET-OWN-105',
    phone: '+91 98992 11029',
    facilityType: 'LOCAL_PHARMACY',
    facilityName: 'Sanjivani Medicos & Healthcare',
    storeArea: 'Arcadia Market, South City 1',
    drugLicenseNo: 'DL-20B-667104',
    active: true,
  },
];

export const SEED_SHARED_LISTINGS: SharedMedicineListing[] = [
  {
    id: 'SHARE-001',
    ownerStoreId: 'USER-LOCAL-RAMESH',
    ownerStoreName: 'CarePlus Chemist & Druggist',
    ownerOwnerName: 'Ramesh Patel',
    ownerCity: 'Sector 14, Gurugram',
    ownerPhone: '+91 98220 77112',
    medicineName: 'Ceftriaxone 1g IV Injection (Monocef)',
    medicineSku: 'MED-CTX-1G',
    batchCode: 'CTX-2026-HERO',
    expiresOn: '2026-11-18', // ~25 days
    availableUnits: 40,
    unitPricePaise: 14500, // ₹145
    discountPercent: 30, // ₹101.50 to peer
    status: 'AVAILABLE',
    createdAt: '2026-10-24 09:30',
    notes: 'Surplus from bulk procurement. Seeking nearby chemist with acute patient prescription demand.',
  },
  {
    id: 'SHARE-002',
    ownerStoreId: 'USER-LOCAL-SURESH',
    ownerStoreName: 'Sharma Medical & General Store',
    ownerOwnerName: 'Suresh Sharma',
    ownerCity: 'Model Town, Delhi',
    ownerPhone: '+91 98110 33412',
    medicineName: 'Amoxicillin + Clavulanate 625mg (Augmentin)',
    medicineSku: 'MED-AMX-CLAV',
    batchCode: 'AMX-2026-09A',
    expiresOn: '2026-12-15', // ~52 days
    availableUnits: 35,
    unitPricePaise: 19800, // ₹198
    discountPercent: 25, // ₹148.50 to peer
    status: 'REQUESTED',
    requestedByStoreId: 'USER-LOCAL-AMIT',
    requestedByStoreName: 'CityMed 24x7 Chemist & Druggist',
    requestedUnits: 20,
    createdAt: '2026-10-24 10:15',
    notes: 'CityMed requested 20 strips to prevent stockout for local outpatient prescriptions.',
  },
  {
    id: 'SHARE-003',
    ownerStoreId: 'USER-LOCAL-POOJA',
    ownerStoreName: 'Apollo Pharmacy CyberHub Franchise',
    ownerOwnerName: 'Pooja Iyer',
    ownerCity: 'DLF Cyber City, Phase 3',
    ownerPhone: '+91 98711 88320',
    medicineName: 'Pantoprazole 40mg IV (Pan-IV)',
    medicineSku: 'MED-PAN-40',
    batchCode: 'PAN-2025-101',
    expiresOn: '2026-11-15', // ~22 days
    availableUnits: 50,
    unitPricePaise: 5500, // ₹55
    discountPercent: 35, // ₹35.75 to peer
    status: 'IN_TRANSIT',
    requestedByStoreId: 'USER-LOCAL-VIKRAM',
    requestedByStoreName: 'Sanjivani Medicos & Healthcare',
    requestedUnits: 50,
    createdAt: '2026-10-24 08:45',
    notes: 'Approved by Pooja Iyer. Dispatched via local runner courier.',
  },
  {
    id: 'SHARE-004',
    ownerStoreId: 'USER-LOCAL-AMIT',
    ownerStoreName: 'CityMed 24x7 Chemist & Druggist',
    ownerOwnerName: 'Amit Verma',
    ownerCity: 'Old Railway Road, Gurugram',
    ownerPhone: '+91 98331 44556',
    medicineName: 'Paracetamol 650mg Tablets (Dolo 650)',
    medicineSku: 'MED-PCM-650',
    batchCode: 'PCM-2026-BULK',
    expiresOn: '2027-01-10', // ~78 days
    availableUnits: 120,
    unitPricePaise: 3200, // ₹32
    discountPercent: 20, // ₹25.60 to peer
    status: 'AVAILABLE',
    createdAt: '2026-10-24 11:20',
    notes: 'Available for immediate pickup or delivery across Gurugram chemist network.',
  },
];

export const DEFAULT_RULES: RuleConfig = {
  expiryWarningDaysRed: 15,
  expiryWarningDaysYellow: 30,
  expiryWarningDaysNeutral: 60,
  safetyStockDaysDefault: 3,
  targetCoverageDaysDefault: 30,
  hospitalTimezone: 'Asia/Kolkata',
  demoFixedDate: '2026-10-24',
};

// Legacy compatibility exports for prototype Landing & Customizer components
export const INITIAL_DRUGS = [
  {
    id: 'DRUG-001',
    name: 'Ceftriaxone 1g Injection',
    category: 'Antibiotic',
    form: 'Vial',
    unitCost: 220,
    dailyUsage: 14,
    critical: true,
    coldChain: false,
    shelfLifeDays: 730,
  },
  {
    id: 'DRUG-002',
    name: 'Meropenem 1g Injection',
    category: 'Antibiotic',
    form: 'Vial',
    unitCost: 950,
    dailyUsage: 5,
    critical: true,
    coldChain: false,
    shelfLifeDays: 730,
  },
  {
    id: 'DRUG-003',
    name: 'Insulin Glargine 100 IU/ml',
    category: 'Antidiabetic',
    form: 'Cartridge',
    unitCost: 650,
    dailyUsage: 8,
    critical: true,
    coldChain: true,
    shelfLifeDays: 365,
  },
  {
    id: 'DRUG-004',
    name: 'Paracetamol 500mg Tablets',
    category: 'Analgesic',
    form: 'Strip of 10',
    unitCost: 25,
    dailyUsage: 60,
    critical: false,
    coldChain: false,
    shelfLifeDays: 1095,
  },
];

export const INITIAL_SUPPLIERS = [
  {
    id: 'SUP-CIPLA',
    name: 'Cipla Therapeutics Ltd.',
    leadTimeDays: 4,
    returnWindowDays: 45,
    contactEmail: 'institutional.orders@cipla.med',
    phone: '+91 22 2482 6000',
  },
  {
    id: 'SUP-SUN',
    name: 'Sun Pharma Lifecare',
    leadTimeDays: 5,
    returnWindowDays: 30,
    contactEmail: 'hospital.supplies@sunpharma.com',
    phone: '+91 22 4324 4324',
  },
];

export const INITIAL_BATCHES = [
  {
    id: 'BATCH-001',
    drugId: 'DRUG-001',
    batchNo: 'B-2041',
    location: 'Main Store' as const,
    qty: 400,
    expiry: '2026-11-18',
    supplierId: 'SUP-CIPLA',
    status: 'active' as const,
  },
  {
    id: 'BATCH-002',
    drugId: 'DRUG-001',
    batchNo: 'B-2042',
    location: 'Ward A' as const,
    qty: 15,
    expiry: '2026-11-05',
    supplierId: 'SUP-CIPLA',
    status: 'active' as const,
  },
];
