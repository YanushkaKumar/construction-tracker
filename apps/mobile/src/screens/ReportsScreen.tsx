import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { DropdownSelector } from '../components/common/DropdownSelector';

export function ReportsScreen() {
  const {
    styles,
    activeColors,
    projects,
    reportsTab,
    setReportsTab,
    reportProjectId,
    setReportProjectId,
    reportBudgets,
    reportExpenses,
    reportProgress,
    fmt,
  } = useAppContext();

  return (
    <View style={{ flex: 1 }}>
      {/* Sub-tabs selectors */}
      <View
        style={[
          styles.subTabsContainer,
          { backgroundColor: activeColors.headerBg, borderBottomColor: activeColors.border },
        ]}
      >
        {['financials', 'expenses', 'progress'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.subTabItem,
              reportsTab === tab && { borderBottomColor: activeColors.accent },
            ]}
            onPress={() => setReportsTab(tab as any)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.subTabText,
                reportsTab === tab
                  ? { color: activeColors.accent, fontWeight: 'bold' }
                  : { color: activeColors.textMuted },
                { fontSize: 12, textTransform: 'capitalize' },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {reportsTab === 'financials' && (
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 12, color: activeColors.text }]}>
              Project Budgets utilizations
            </Text>
            {reportBudgets.map((b) => {
              const pct = b.budgetEstimate > 0 ? Math.round((b.budgetActual / b.budgetEstimate) * 100) : 0;
              return (
                <View
                  key={b.id}
                  style={[
                    styles.premiumCardItem,
                    { backgroundColor: activeColors.card, borderColor: activeColors.border },
                  ]}
                >
                  <View style={styles.projectHeaderRow}>
                    <Text style={[styles.projectNameText, { color: activeColors.text }]}>
                      {b.name}
                    </Text>
                    <Text style={{ color: pct > 90 ? '#f43f5e' : '#10b981', fontWeight: 'bold' }}>
                      {pct}%
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.progressRailBg,
                      { marginVertical: 10, backgroundColor: activeColors.background },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressRailFill,
                        {
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: pct > 90 ? '#f43f5e' : '#10b981',
                        },
                      ]}
                    />
                  </View>
                  <Text style={{ color: activeColors.textMuted, fontSize: 11 }}>
                    Spent: {fmt(b.budgetActual)} of {fmt(b.budgetEstimate)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {reportsTab === 'expenses' && (
          <View>
            <DropdownSelector
              label="Target Project Filter"
              value={reportProjectId}
              options={[
                { label: 'All Company Sites', value: 'ALL' },
                ...projects.map((p) => ({ label: p.code, value: p.id })),
              ]}
              onSelect={setReportProjectId}
            />

            <Text
              style={[
                styles.sectionTitle,
                { marginTop: 10, marginBottom: 12, color: activeColors.text },
              ]}
            >
              Expenses weightings breakdowns
            </Text>
            {reportExpenses.map((exp, idx) => (
              <View
                key={idx}
                style={[
                  styles.premiumCardItem,
                  { backgroundColor: activeColors.card, borderColor: activeColors.border },
                ]}
              >
                <View style={styles.projectHeaderRow}>
                  <Text style={[styles.taskTitleText, { color: activeColors.text }]}>
                    {exp.category}
                  </Text>
                  <Text style={[styles.premiumEarningsEstimate, { color: activeColors.accent }]}>
                    {fmt(exp.total)}
                  </Text>
                </View>
              </View>
            ))}
            {reportExpenses.length === 0 && (
              <Text style={[styles.emptyPlaceholderText, { color: activeColors.textMuted }]}>
                No logged expenses charts available
              </Text>
            )}
          </View>
        )}

        {reportsTab === 'progress' && (
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 12, color: activeColors.text }]}>
              Construction Timelines
            </Text>
            {reportProgress.map((p) => (
              <View
                key={p.id}
                style={[
                  styles.premiumCardItem,
                  { backgroundColor: activeColors.card, borderColor: activeColors.border },
                ]}
              >
                <View style={styles.projectHeaderRow}>
                  <Text style={[styles.projectNameText, { color: activeColors.text }]}>
                    {p.name}
                  </Text>
                  <Text style={{ color: '#10b981', fontWeight: 'bold' }}>{p.progressPercent}%</Text>
                </View>
                <View
                  style={[
                    styles.progressRailBg,
                    { marginVertical: 10, backgroundColor: activeColors.background },
                  ]}
                >
                  <View
                    style={[
                      styles.progressRailFill,
                      { width: `${p.progressPercent}%`, backgroundColor: '#10b981' },
                    ]}
                  />
                </View>
                <Text style={{ color: activeColors.textMuted, fontSize: 11 }}>
                  Target End: {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
