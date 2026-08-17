import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMaterials() {
  console.log('Seeding demo materials for ALL companies...');
  
  const companies = await prisma.company.findMany();
  if (companies.length === 0) {
    console.error('No companies found.');
    process.exit(1);
  }

  const materials = [
    { name: 'Portland Cement (50kg)', unit: 'Bag', unitPrice: 2800, category: 'Cement & Concrete', minimumStock: 50 },
    { name: 'River Sand', unit: 'Cube', unitPrice: 15000, category: 'Aggregates', minimumStock: 5 },
    { name: 'Metal 3/4"', unit: 'Cube', unitPrice: 18000, category: 'Aggregates', minimumStock: 5 },
    { name: 'TMT Steel Rebar 10mm', unit: 'Ton', unitPrice: 320000, category: 'Steel & Metals', minimumStock: 1 },
    { name: 'TMT Steel Rebar 12mm', unit: 'Ton', unitPrice: 320000, category: 'Steel & Metals', minimumStock: 1 },
    { name: 'Red Bricks', unit: 'Nos', unitPrice: 35, category: 'Bricks & Blocks', minimumStock: 1000 },
    { name: 'Cement Blocks (4")', unit: 'Nos', unitPrice: 85, category: 'Bricks & Blocks', minimumStock: 500 },
    { name: 'Plywood Sheet (8x4x12mm)', unit: 'Sheet', unitPrice: 4500, category: 'Timber & Boards', minimumStock: 20 },
    { name: 'PVC Pipe 110mm (Type 600)', unit: 'Length', unitPrice: 2400, category: 'Plumbing', minimumStock: 15 },
    { name: 'Copper Wire 1.0mm (100m)', unit: 'Coil', unitPrice: 6500, category: 'Electrical', minimumStock: 10 }
  ];

  const suppliers = [
    { name: 'Holcim Lanka Ltd', contactPerson: 'Nimal', phone: '0771234567', materialTypes: ['Cement & Concrete'] },
    { name: 'Tokyo Super', contactPerson: 'Kamal', phone: '0712345678', materialTypes: ['Cement & Concrete'] },
    { name: 'Melwire Rolling', contactPerson: 'Silva', phone: '0751234567', materialTypes: ['Steel & Metals'] }
  ];

  let addedMat = 0;
  for (const company of companies) {
    for (const m of materials) {
      const exists = await prisma.material.findFirst({ where: { companyId: company.id, name: m.name } });
      if (!exists) {
        await prisma.material.create({
          data: {
            companyId: company.id,
            name: m.name,
            unit: m.unit,
            unitPrice: m.unitPrice,
            category: m.category,
            minimumStock: m.minimumStock
          }
        });
        addedMat++;
      }
    }

    for (const s of suppliers) {
      const exists = await prisma.supplier.findFirst({ where: { companyId: company.id, name: s.name } });
      if (!exists) {
        await prisma.supplier.create({
          data: {
            companyId: company.id,
            name: s.name,
            contactPerson: s.contactPerson,
            phone: s.phone,
            materialTypes: s.materialTypes,
            isActive: true
          }
        });
      }
    }
  }

  console.log(`Successfully added ${addedMat} standard construction materials across all companies!`);
}

seedMaterials()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
