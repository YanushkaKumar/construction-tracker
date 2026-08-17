import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class BOQService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Tenancy helpers ───────────────────────
  // BOQ rows carry no companyId of their own, so every lookup is scoped
  // through the owning project. Section/item ids and the projectId all arrive
  // from client input and must never be trusted on their own.

  private async assertProjectInCompany(projectId: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');
  }

  private async findSectionScoped(id: string, companyId: string) {
    const section = await this.prisma.bOQSection.findFirst({
      where: { id, project: { companyId } },
    });
    if (!section) throw new NotFoundException('BOQ section not found');
    return section;
  }

  private async findItemScoped(id: string, companyId: string) {
    const item = await this.prisma.bOQItem.findFirst({
      where: { id, project: { companyId } },
    });
    if (!item) throw new NotFoundException('BOQ item not found');
    return item;
  }

  // ── Sections ──────────────────────────────

  async createSection(projectId: string, companyId: string, data: any) {
    await this.assertProjectInCompany(projectId, companyId);

    const maxOrder = await this.prisma.bOQSection.aggregate({
      where: { projectId },
      _max: { sortOrder: true },
    });
    return this.prisma.bOQSection.create({
      data: {
        projectId,
        title: data.title,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
      include: { items: true },
    });
  }

  async getSections(projectId: string) {
    return this.prisma.bOQSection.findMany({
      where: { projectId },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateSection(id: string, companyId: string, data: any) {
    await this.findSectionScoped(id, companyId);

    return this.prisma.bOQSection.update({
      where: { id },
      data: { title: data.title },
    });
  }

  async deleteSection(id: string, companyId: string) {
    await this.findSectionScoped(id, companyId);

    return this.prisma.bOQSection.delete({ where: { id } });
  }

  // ── Items ─────────────────────────────────

  async createItem(sectionId: string, companyId: string, data: any) {
    // Derive the project from the section rather than trusting data.projectId,
    // which would otherwise let an item be filed against any project.
    const section = await this.findSectionScoped(sectionId, companyId);
    const projectId = section.projectId;

    const amount = Number(data.quantity) * Number(data.rate);
    const maxOrder = await this.prisma.bOQItem.aggregate({
      where: { sectionId },
      _max: { sortOrder: true },
    });
    return this.prisma.bOQItem.create({
      data: {
        sectionId,
        projectId,
        itemNo: data.itemNo,
        description: data.description,
        unit: data.unit,
        quantity: data.quantity,
        rate: data.rate,
        amount,
        actualQty: data.actualQty || null,
        actualAmount: data.actualAmount || null,
        remarks: data.remarks || null,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    });
  }

  async updateItem(id: string, companyId: string, data: any) {
    await this.findItemScoped(id, companyId);

    const updateData: any = {};
    if (data.itemNo !== undefined) updateData.itemNo = data.itemNo;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.rate !== undefined) updateData.rate = data.rate;
    if (data.quantity !== undefined && data.rate !== undefined) {
      updateData.amount = Number(data.quantity) * Number(data.rate);
    }
    if (data.actualQty !== undefined) updateData.actualQty = data.actualQty;
    if (data.actualAmount !== undefined) updateData.actualAmount = data.actualAmount;
    if (data.remarks !== undefined) updateData.remarks = data.remarks;

    return this.prisma.bOQItem.update({ where: { id }, data: updateData });
  }

  async deleteItem(id: string, companyId: string) {
    await this.findItemScoped(id, companyId);

    return this.prisma.bOQItem.delete({ where: { id } });
  }

  // ── Summary ───────────────────────────────

  async getProjectBOQSummary(projectId: string, companyId: string) {
    await this.assertProjectInCompany(projectId, companyId);

    const sections = await this.getSections(projectId);
    let totalEstimated = 0;
    let totalActual = 0;
    let totalItems = 0;

    for (const section of sections) {
      for (const item of section.items) {
        totalEstimated += Number(item.amount);
        totalActual += Number(item.actualAmount || 0);
        totalItems++;
      }
    }

    return {
      sections,
      summary: {
        totalSections: sections.length,
        totalItems,
        totalEstimated,
        totalActual,
        variance: totalEstimated - totalActual,
        variancePercent: totalEstimated > 0
          ? Math.round(((totalEstimated - totalActual) / totalEstimated) * 100)
          : 0,
      },
    };
  }
}
