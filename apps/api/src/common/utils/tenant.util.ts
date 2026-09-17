import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../modules/database/prisma.service';

/**
 * Tenant-ownership checks.
 *
 * The rule: a caller's `companyId` always comes from their JWT, never from the
 * resource being addressed. Looking the resource up first and then trusting the
 * `companyId` hanging off it proves only that the row exists — not that the
 * caller is entitled to it, which lets any authenticated user reach another
 * tenant's data by guessing an id.
 *
 * These throw NotFoundException rather than ForbiddenException on purpose: a
 * caller from another tenant should not be able to tell "exists but forbidden"
 * apart from "does not exist", since that difference alone leaks which ids are
 * real.
 */

/** Confirm a project belongs to the caller's company. */
export async function assertProjectInCompany(
  prisma: PrismaService,
  projectId: string,
  companyId: string,
): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId },
    select: { id: true },
  });
  if (!project) throw new NotFoundException('Project not found');
}

/** Confirm a subcontractor contract belongs to the caller's company. */
export async function assertContractInCompany(
  prisma: PrismaService,
  contractId: string,
  companyId: string,
): Promise<void> {
  const contract = await prisma.subcontractorContract.findFirst({
    where: { id: contractId, subcontractor: { companyId } },
    select: { id: true },
  });
  if (!contract) throw new NotFoundException('Contract not found');
}
