'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';

const fmt = (n: number) => `LKR ${Math.abs(n).toLocaleString()}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

interface Asset {
  [key: string]: any;
}

export function AssetsTab() {
  const { data, isLoading } = useQuery<Asset[]>({
    queryKey: ['finance-assets'],
    queryFn: async () => (await apiClient.get('/assets')).data,
    retry: 1,
  });

  const assets = data ?? [];

  const columns: Column<Asset>[] = [
    {
      key: 'name',
      header: 'Asset Name',
      sortable: true,
      render: r => (
        <div>
          <p className="text-[13px] font-semibold">{r.name}</p>
          {r.serialNumber && (
            <p className="text-[10px] font-mono text-muted-foreground/50">{r.serialNumber}</p>
          )}
        </div>
      ),
    },
    {
      key: 'assetType',
      header: 'Type',
      sortable: true,
      render: r => <StatusBadge status={r.assetType ?? 'GENERAL'} size="sm" />,
      getValue: r => r.assetType,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: r => <StatusBadge status={r.status} size="sm" />,
      getValue: r => r.status,
    },
    {
      key: 'assignedToProject',
      header: 'Assigned To',
      render: r => <span className="text-[13px] text-muted-foreground/80">{r.assignedToProject?.name ?? '—'}</span>,
    },
    {
      key: 'purchaseDate',
      header: 'Purchased',
      sortable: true,
      render: r => <span className="text-[12px] font-mono text-muted-foreground/70">{fmtDate(r.purchase?.purchaseDate ?? r.createdAt)}</span>,
      getValue: r => r.purchase?.purchaseDate ?? r.createdAt,
    },
    {
      key: 'funding',
      header: 'Funding Sources',
      render: r => {
        const fallocs = (r as any).fundingAllocations || [];
        if (fallocs.length === 0) return <span className="text-muted-foreground/50">—</span>;
        return (
          <div className="space-y-0.5">
            {fallocs.map((fa: any) => (
              <div key={fa.id} className="text-[11px] leading-tight font-semibold">
                <span className="text-primary">{fa.fundingSource?.name}</span>
                <span className="text-[9px] text-muted-foreground/60 font-mono ml-1">({fmt(fa.amount)})</span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: 'purchaseValue',
      header: 'Value',
      align: 'right',
      sortable: true,
      render: r => <span className="text-[13px] font-bold font-mono">{fmt(r.purchasePrice)}</span>,
      getValue: r => r.purchasePrice,
    },
  ];

  return (
    <DataTable
      data={assets}
      columns={columns}
      keyField="id"
      loading={isLoading}
      searchable
      searchPlaceholder="Search assets…"
      paginated
      pageSize={15}
      exportable
      density="comfortable"
      caption="Company asset registry"
    />
  );
}
