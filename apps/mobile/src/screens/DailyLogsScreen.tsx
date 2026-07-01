import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { DropdownSelector } from '../components/common/DropdownSelector';
import { DailyLogModal } from '../components/modals/DailyLogModal';

export function DailyLogsScreen() {
  const {
    styles,
    activeColors,
    projects,
    dailyLogs,
    dailyLogsFilterProjectId,
    setDailyLogsFilterProjectId,
  } = useAppContext();

  const [isDailyLogModalOpen, setIsDailyLogModalOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {/* Filter bar */}
      <View
        style={[
          styles.filterBarContainer,
          { backgroundColor: activeColors.headerBg, borderBottomColor: activeColors.border },
        ]}
      >
        <DropdownSelector
          label="Select Project"
          value={dailyLogsFilterProjectId}
          options={projects.map((p) => ({ label: `${p.code} — ${p.name}`, value: p.id }))}
          onSelect={setDailyLogsFilterProjectId}
          placeholder="Choose Site..."
          style={{ marginBottom: 0 }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: activeColors.text }]}>Daily site reports</Text>
          <TouchableOpacity
            style={[styles.premiumHeaderButton, { backgroundColor: activeColors.accent }]}
            onPress={() => setIsDailyLogModalOpen(true)}
            activeOpacity={0.7}
          >
            <Plus size={12} color={activeColors.textDark} />
            <Text style={[styles.premiumHeaderBtnText, { color: activeColors.textDark }]}>
              Submit Log
            </Text>
          </TouchableOpacity>
        </View>

        {dailyLogs.map((log) => (
          <View
            key={log.id}
            style={[
              styles.premiumCardItem,
              { backgroundColor: activeColors.card, borderColor: activeColors.border },
            ]}
          >
            <View style={styles.projectHeaderRow}>
              <Text style={[styles.logDateText, { color: activeColors.text }]}>
                {new Date(log.reportDate).toLocaleDateString()}
              </Text>
              <Text style={[styles.logWeatherText, { color: activeColors.textMuted }]}>
                ⛅ {log.weatherCondition}
              </Text>
            </View>
            <Text style={[styles.logWorkSummaryText, { color: activeColors.text }]}>
              {log.workSummary}
            </Text>
            {log.issues && (
              <View style={styles.issuesBadgeContainer}>
                <Text style={styles.issuesBadgeText}>⚠️ Issues: {log.issues}</Text>
              </View>
            )}
            {log.safetyNotes && (
              <View
                style={[
                  styles.issuesBadgeContainer,
                  {
                    backgroundColor: 'rgba(16,185,129,0.06)',
                    borderColor: 'rgba(16,185,129,0.15)',
                  },
                ]}
              >
                <Text style={[styles.issuesBadgeText, { color: '#10b981' }]}>
                  🛡️ Safety: {log.safetyNotes}
                </Text>
              </View>
            )}
            <View style={[styles.logRowFooter, { borderTopColor: activeColors.borderMuted }]}>
              <Text style={[styles.logMetaDetails, { color: activeColors.textMuted }]}>
                Crew Strength: {log.workersOnSite}
              </Text>
              <Text style={[styles.logMetaDetails, { color: activeColors.textMuted }]}>
                Reporter: {log.reporter?.firstName} {log.reporter?.lastName}
              </Text>
            </View>
          </View>
        ))}

        {dailyLogs.length === 0 && (
          <Text style={[styles.emptyPlaceholderText, { color: activeColors.textMuted }]}>
            No site activity logged for this project
          </Text>
        )}
      </ScrollView>

      <DailyLogModal visible={isDailyLogModalOpen} onClose={() => setIsDailyLogModalOpen(false)} />
    </View>
  );
}
