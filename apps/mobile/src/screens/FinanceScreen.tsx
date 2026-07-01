import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { AdvanceModal } from '../components/modals/AdvanceModal';
import { PurchaseModal } from '../components/modals/PurchaseModal';
import { RejectionModal } from '../components/modals/RejectionModal';
import { ProjectFinance } from '../types';

export function FinanceScreen() {
  const {
    styles,
    activeColors,
    theme,
    user,
    financeOverview,
    financeSubTab,
    setFinanceSubTab,
    advances,
    purchases,
    pendingExpenses,
    isTablet,
    handleApproveExpense,
    fmt,
  } = useAppContext();

  // Local state for modals triggered by finance tab
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [expenseToRejectId, setExpenseToRejectId] = useState<string | null>(null);

  const isAuthorizer =
    user?.role === 'COMPANY_OWNER' ||
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'ACCOUNTANT';

  // Role-based finance sub-tabs definition
  const subTabs = isAuthorizer
    ? ['overview', 'advances', 'purchases', 'approvals']
    : ['overview', 'advances', 'purchases'];

  return (
    <View style={{ flex: 1 }}>
      {/* Quick Record Operations at the top */}
      <View style={[styles.financeHeaderButtons, { borderBottomColor: activeColors.border }]}>
        <TouchableOpacity
          style={[styles.financeActionBtn, { backgroundColor: '#10b981' }]}
          onPress={() => setIsAdvanceModalOpen(true)}
          activeOpacity={0.7}
        >
          <Plus size={15} color="#ffffff" style={styles.btnIcon} />
          <Text style={[styles.financeBtnText, { color: '#ffffff' }]}>Record Advance</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.financeActionBtn, { backgroundColor: activeColors.accent }]}
          onPress={() => setIsPurchaseModalOpen(true)}
          activeOpacity={0.7}
        >
          <Plus size={15} color={activeColors.textDark} style={styles.btnIcon} />
          <Text style={[styles.financeBtnText, { color: activeColors.textDark }]}>Log Purchase</Text>
        </TouchableOpacity>
      </View>

      {/* Sub-tabs selectors */}
      <View
        style={[
          styles.subTabsContainer,
          { backgroundColor: activeColors.headerBg, borderBottomColor: activeColors.border },
        ]}
      >
        {subTabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.subTabItem,
              financeSubTab === tab && { borderBottomColor: activeColors.accent },
              { paddingHorizontal: 12 },
            ]}
            onPress={() => setFinanceSubTab(tab as any)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.subTabText,
                financeSubTab === tab
                  ? { color: activeColors.accent, fontWeight: 'bold' }
                  : { color: activeColors.textMuted },
                { fontSize: 11, textTransform: 'capitalize' },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {financeSubTab === 'overview' && (
          <View>
            {/* Executive Digital Wallet Card */}
            <View
              style={[
                styles.walletHeaderCard,
                {
                  backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
                  borderColor: activeColors.border,
                },
              ]}
            >
              <Text style={[styles.walletLabel, { color: activeColors.textMuted }]}>
                Available Capital
              </Text>
              <Text style={[styles.walletBalance, { color: activeColors.text }]}>
                {fmt(financeOverview?.companyTotals?.balance || 0)}
              </Text>

              <View style={[styles.walletSummaryRow, { borderTopColor: activeColors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.walletStatLabel, { color: activeColors.textMuted }]}>
                    Total Advanced
                  </Text>
                  <Text style={[styles.walletStatValue, { color: '#10b981' }]}>
                    {fmt(financeOverview?.companyTotals?.totalAdvance || 0)}
                  </Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={[styles.walletStatLabel, { color: activeColors.textMuted }]}>
                    Total Spends
                  </Text>
                  <Text style={[styles.walletStatValue, { color: '#ef4444' }]}>
                    {fmt(financeOverview?.companyTotals?.totalSpent || 0)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: activeColors.text }]}>
                Budget Breakdown
              </Text>
            </View>
            <View style={isTablet ? styles.tabletGridContainer : null}>
              {(financeOverview?.projectBreakdown || []).map((p: ProjectFinance) => {
                const percentageSpent = p.totalAdvance > 0 ? (p.totalSpent / p.totalAdvance) * 100 : 0;
                const isOverdrawn = p.balance < 0;
                return (
                  <View
                    key={p.id}
                    style={
                      isTablet
                        ? [
                            styles.premiumCardItem,
                            styles.tabletGridCard,
                            { backgroundColor: activeColors.card, borderColor: activeColors.border },
                          ]
                        : [
                            styles.premiumCardItem,
                            { backgroundColor: activeColors.card, borderColor: activeColors.border },
                          ]
                    }
                  >
                    <View style={styles.projectHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.projectNameText, { color: activeColors.text }]}
                          numberOfLines={1}
                        >
                          {p.name}
                        </Text>
                        <Text style={styles.projectCodeLabel}>{p.code}</Text>
                      </View>
                      <View
                        style={[
                          styles.projectProgressPill,
                          {
                            backgroundColor: isOverdrawn
                              ? 'rgba(239, 68, 68, 0.1)'
                              : 'rgba(16, 185, 129, 0.1)',
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: isOverdrawn ? '#ef4444' : '#10b981',
                            fontSize: 9,
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                          }}
                        >
                          {isOverdrawn ? 'Overdrawn' : 'Healthy'}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.breakdownValuesRow,
                        { borderBottomWidth: 0, paddingBottom: 0, marginTop: 12 },
                      ]}
                    >
                      <View style={styles.breakdownColumn}>
                        <Text style={[styles.breakdownLabel, { color: activeColors.textMuted }]}>
                          Advance
                        </Text>
                        <Text style={[styles.breakdownVal, { color: '#10b981', fontSize: 13 }]}>
                          {fmt(p.totalAdvance)}
                        </Text>
                      </View>
                      <View style={styles.breakdownColumn}>
                        <Text style={[styles.breakdownLabel, { color: activeColors.textMuted }]}>
                          Spent
                        </Text>
                        <Text style={[styles.breakdownVal, { color: '#ef4444', fontSize: 13 }]}>
                          {fmt(p.totalSpent)}
                        </Text>
                      </View>
                      <View style={styles.breakdownColumn}>
                        <Text style={[styles.breakdownLabel, { color: activeColors.textMuted }]}>
                          Balance
                        </Text>
                        <Text
                          style={[
                            styles.breakdownVal,
                            { color: isOverdrawn ? '#ef4444' : '#3b82f6', fontSize: 13 },
                          ]}
                        >
                          {fmt(p.balance)}
                        </Text>
                      </View>
                    </View>

                    <View style={{ marginTop: 12 }}>
                      <View
                        style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}
                      >
                        <Text style={{ fontSize: 10, color: activeColors.textMuted }}>Utilized</Text>
                        <Text style={{ fontSize: 10, color: activeColors.text, fontWeight: 'bold' }}>
                          {percentageSpent.toFixed(0)}%
                        </Text>
                      </View>
                      <View style={[styles.progressRailBg, { backgroundColor: activeColors.background }]}>
                        <View
                          style={[
                            styles.progressRailFill,
                            {
                              backgroundColor:
                                percentageSpent > 100
                                  ? '#ef4444'
                                  : percentageSpent > 80
                                  ? '#f59e0b'
                                  : '#10b981',
                              width: `${Math.min(percentageSpent, 100)}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {financeSubTab === 'advances' && (
          <View>
            <View style={isTablet ? styles.tabletGridContainer : null}>
              {advances.map((a) => (
                <View
                  key={a.id}
                  style={
                    isTablet
                      ? [
                          styles.premiumCardItem,
                          styles.tabletGridCard,
                          { backgroundColor: activeColors.card, borderColor: activeColors.border },
                        ]
                      : [
                          styles.premiumCardItem,
                          { backgroundColor: activeColors.card, borderColor: activeColors.border },
                        ]
                  }
                >
                  <View style={styles.projectHeaderRow}>
                    <Text
                      style={[styles.taskTitleText, { color: activeColors.text }]}
                      numberOfLines={1}
                    >
                      {a.description}
                    </Text>
                    <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 14 }}>
                      {fmt(a.amount)}
                    </Text>
                  </View>
                  <View style={[styles.taskRowFooter, { borderTopColor: activeColors.border }]}>
                    <Text style={[styles.taskAssigneeText, { color: activeColors.textMuted }]}>
                      Site Code: {a.project?.code || '—'}
                    </Text>
                    <Text style={[styles.taskAssigneeText, { color: activeColors.textMuted }]}>
                      {new Date(a.receivedDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            {advances.length === 0 && (
              <Text style={[styles.emptyPlaceholderText, { color: activeColors.textMuted }]}>
                No advances recorded yet
              </Text>
            )}
          </View>
        )}

        {financeSubTab === 'purchases' && (
          <View>
            <View style={isTablet ? styles.tabletGridContainer : null}>
              {purchases.map((p) => (
                <View
                  key={p.id}
                  style={
                    isTablet
                      ? [
                          styles.premiumCardItem,
                          styles.tabletGridCard,
                          { backgroundColor: activeColors.card, borderColor: activeColors.border },
                        ]
                      : [
                          styles.premiumCardItem,
                          { backgroundColor: activeColors.card, borderColor: activeColors.border },
                        ]
                  }
                >
                  <View style={styles.projectHeaderRow}>
                    <Text
                      style={[styles.taskTitleText, { color: activeColors.text }]}
                      numberOfLines={1}
                    >
                      {p.title}
                    </Text>
                    <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 14 }}>
                      {fmt(p.totalAmount)}
                    </Text>
                  </View>
                  <View style={[styles.taskRowFooter, { borderTopColor: activeColors.border }]}>
                    <Text style={[styles.taskAssigneeText, { color: activeColors.textMuted }]}>
                      {p.category.replace('_', ' ')}
                    </Text>
                    <Text style={[styles.taskAssigneeText, { color: activeColors.textMuted }]}>
                      {new Date(p.purchaseDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.purchaseAllocationList}>
                    {p.allocations.map((a) => (
                      <View
                        key={a.id}
                        style={[
                          styles.allocationPill,
                          {
                            backgroundColor: activeColors.background,
                            borderColor: activeColors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.allocationPillText, { color: activeColors.text }]}>
                          {a.project?.code}: {fmt(a.amount)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
            {purchases.length === 0 && (
              <Text style={[styles.emptyPlaceholderText, { color: activeColors.textMuted }]}>
                No purchases logged yet
              </Text>
            )}
          </View>
        )}

        {isAuthorizer && financeSubTab === 'approvals' && (
          <View>
            {pendingExpenses.map((exp) => (
              <View
                key={exp.id}
                style={[
                  styles.premiumCardItem,
                  { backgroundColor: activeColors.card, borderColor: activeColors.border },
                ]}
              >
                <View style={styles.projectHeaderRow}>
                  <Text style={[styles.taskTitleText, { color: activeColors.text }]}>
                    {exp.title}
                  </Text>
                  <Text style={[styles.premiumEarningsEstimate, { color: '#f43f5e' }]}>
                    {fmt(exp.amount)}
                  </Text>
                </View>
                <Text style={[styles.taskDescText, { color: activeColors.textMuted }]}>
                  Site: {exp.project?.code} • Submitter: {exp.submittedBy?.firstName}{' '}
                  {exp.submittedBy?.lastName}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[
                      styles.premiumActionButton,
                      { flex: 1, backgroundColor: '#10b981', height: 36 },
                    ]}
                    onPress={() => handleApproveExpense(exp.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.premiumActionButton,
                      { flex: 1, backgroundColor: '#f43f5e', height: 36 },
                    ]}
                    onPress={() => {
                      setExpenseToRejectId(exp.id);
                      setIsRejectionModalOpen(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {pendingExpenses.length === 0 && (
              <Text style={[styles.emptyPlaceholderText, { color: activeColors.textMuted }]}>
                All expenses are approved and processed
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Finance screens modals */}
      <AdvanceModal visible={isAdvanceModalOpen} onClose={() => setIsAdvanceModalOpen(false)} />
      <PurchaseModal visible={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} />
      <RejectionModal
        visible={isRejectionModalOpen}
        onClose={() => {
          setIsRejectionModalOpen(false);
          setExpenseToRejectId(null);
        }}
        expenseId={expenseToRejectId}
      />
    </View>
  );
}
