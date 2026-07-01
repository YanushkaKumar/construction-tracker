import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { AddProjectModal } from '../components/modals/AddProjectModal';

export function ProjectsScreen() {
  const {
    styles,
    activeColors,
    projects,
    isTablet,
    setSelectedProjectDetailId,
    setActiveScreen,
    fmt,
  } = useAppContext();

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: activeColors.text }]}>Site Registers</Text>
          <TouchableOpacity
            style={[styles.premiumHeaderButton, { backgroundColor: activeColors.accent }]}
            onPress={() => setIsAddProjectOpen(true)}
            activeOpacity={0.7}
          >
            <Plus size={14} color={activeColors.textDark} />
            <Text style={[styles.premiumHeaderBtnText, { color: activeColors.textDark }]}>Add Site</Text>
          </TouchableOpacity>
        </View>

        <View style={isTablet ? styles.tabletGridContainer : null}>
          {projects.map((p) => (
            <TouchableOpacity
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
              onPress={() => {
                setSelectedProjectDetailId(p.id);
                setActiveScreen('project-detail');
              }}
              activeOpacity={0.75}
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
                <StatusBadge type="status" value={p.status} />
              </View>

              <View
                style={{
                  marginTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: activeColors.border,
                  paddingTop: 10,
                }}
              >
                <Text style={[styles.cardMetaLabel, { color: activeColors.textMuted }]}>
                  Location:{' '}
                  <Text style={[styles.cardMetaValue, { color: activeColors.text }]}>
                    {p.location || 'Not Specified'}
                  </Text>
                </Text>
                <Text style={[styles.cardMetaLabel, { color: activeColors.textMuted }]}>
                  Client:{' '}
                  <Text style={[styles.cardMetaValue, { color: activeColors.text }]}>
                    {p.clientName || 'N/A'}
                  </Text>
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: activeColors.textMuted, fontSize: 11 }}>Estimate Cost:</Text>
                  <Text style={styles.cardHighlightEstimate}>{fmt(p.budgetEstimate)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <AddProjectModal visible={isAddProjectOpen} onClose={() => setIsAddProjectOpen(false)} />
    </View>
  );
}
