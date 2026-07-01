import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  Building2,
  Wallet,
  DollarSign,
  CheckSquare,
  Users,
  FileText,
  Activity,
} from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { AddProjectModal } from '../components/modals/AddProjectModal';
import { TaskModal } from '../components/modals/TaskModal';
import { DailyLogModal } from '../components/modals/DailyLogModal';

export function DashboardScreen() {
  const {
    styles,
    activeColors,
    user,
    projects,
    dashboardStats,
    auditLogs,
    isTablet,
    setActiveScreen,
    setSelectedProjectDetailId,
    setWorkersTab,
    setAttendanceProjectId,
    setDailyLogsFilterProjectId,
    fmt,
  } = useAppContext();

  // Local state for modals triggered by dashboard quick actions
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDailyLogModalOpen, setIsDailyLogModalOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Banner */}
        <View
          style={[
            styles.welcomeBanner,
            { backgroundColor: activeColors.card, borderColor: activeColors.border },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.welcomeSubtitle, { color: activeColors.textMuted }]}>
              Welcome Back,
            </Text>
            <Text style={[styles.welcomeTitle, { color: activeColors.text }]}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
          <View
            style={[
              styles.welcomeRoleBadge,
              { backgroundColor: activeColors.accentBg, borderColor: activeColors.accent },
            ]}
          >
            <Text style={[styles.welcomeRoleText, { color: activeColors.accent }]}>
              {user?.roleDisplayName}
            </Text>
          </View>
        </View>

        {/* Top KPI Widgets */}
        <View style={styles.kpiGrid}>
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: activeColors.card, borderColor: activeColors.border },
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.kpiLabel, { color: activeColors.textMuted }]}>Sites Roster</Text>
              <Building2 size={13} color={activeColors.textMuted} />
            </View>
            <Text style={[styles.kpiValue, { color: activeColors.text }]}>{projects.length}</Text>
          </View>
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: activeColors.card, borderColor: 'rgba(13, 148, 136, 0.25)' },
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.kpiLabel, { color: '#0d9488' }]}>Cash Capital</Text>
              <Wallet size={13} color="#0d9488" />
            </View>
            <Text style={[styles.kpiValue, { color: '#0d9488' }]}>
              {fmt(dashboardStats?.kpis?.totalAdvance || 0)}
            </Text>
          </View>
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: activeColors.card, borderColor: 'rgba(244, 63, 94, 0.25)' },
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.kpiLabel, { color: '#f43f5e' }]}>Vouchers Pending</Text>
              <DollarSign size={13} color="#f43f5e" />
            </View>
            <Text style={[styles.kpiValue, { color: '#f43f5e' }]}>
              {dashboardStats?.kpis?.pendingExpenses || 0}
            </Text>
          </View>
        </View>

        {/* Quick Actions Panel - 4-tile grid */}
        <View
          style={[
            styles.premiumCard,
            { backgroundColor: activeColors.card, borderColor: activeColors.border },
          ]}
        >
          <Text style={[styles.cardHeaderTitle, { color: activeColors.textMuted }]}>
            Quick Operations
          </Text>
          <View style={styles.commandGridRow}>
            <TouchableOpacity
              style={[
                styles.commandGridItem,
                { backgroundColor: activeColors.background, borderColor: activeColors.inputBorder },
              ]}
              onPress={() => setIsAddProjectOpen(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.commandIconBox, { backgroundColor: activeColors.accentBg }]}>
                <Building2 size={18} color={activeColors.accent} />
              </View>
              <Text style={[styles.commandLabel, { color: activeColors.text }]}>Add Project</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.commandGridItem,
                { backgroundColor: activeColors.background, borderColor: activeColors.inputBorder },
              ]}
              onPress={() => setIsTaskModalOpen(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.commandIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                <CheckSquare size={18} color="#6366f1" />
              </View>
              <Text style={[styles.commandLabel, { color: activeColors.text }]}>Add Task</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.commandGridRow, { marginTop: 10 }]}>
            <TouchableOpacity
              style={[
                styles.commandGridItem,
                { backgroundColor: activeColors.background, borderColor: activeColors.inputBorder },
              ]}
              onPress={() => {
                setAttendanceProjectId(projects[0]?.id || '');
                setWorkersTab('attendance');
                setActiveScreen('workers');
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.commandIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Users size={18} color="#10b981" />
              </View>
              <Text style={[styles.commandLabel, { color: activeColors.text }]}>Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.commandGridItem,
                { backgroundColor: activeColors.background, borderColor: activeColors.inputBorder },
              ]}
              onPress={() => {
                setDailyLogsFilterProjectId(projects[0]?.id || '');
                setIsDailyLogModalOpen(true);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.commandIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                <FileText size={18} color="#ec4899" />
              </View>
              <Text style={[styles.commandLabel, { color: activeColors.text }]}>Daily Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Project schedules card list */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: activeColors.text }]}>
            Construction Schedules
          </Text>
        </View>
        <View style={isTablet ? styles.tabletGridContainer : null}>
          {projects.map((p: any) => (
            <TouchableOpacity
              key={p.id}
              style={
                isTablet
                  ? [
                      styles.projectScheduleCard,
                      styles.tabletGridCard,
                      { backgroundColor: activeColors.card, borderColor: activeColors.border },
                    ]
                  : [
                      styles.projectScheduleCard,
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
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={[styles.projectNameText, { color: activeColors.text }]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                  <Text style={styles.projectCodeLabel}>{p.code}</Text>
                </View>
                <View style={styles.projectProgressPill}>
                  <Text style={styles.projectProgressText}>{p.progressPercent || 0}% Done</Text>
                </View>
              </View>
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 11, color: activeColors.textMuted }} numberOfLines={1}>
                  Location:{' '}
                  <Text style={{ color: activeColors.text, fontWeight: '500' }}>
                    {p.location || 'Not Specified'}
                  </Text>
                </Text>
              </View>
              <View style={[styles.progressRailBg, { backgroundColor: activeColors.background }]}>
                <View
                  style={[
                    styles.progressRailFill,
                    { backgroundColor: activeColors.accent, width: `${p.progressPercent || 0}%` },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Audit Trails */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: activeColors.text }]}>
            Real-time Audit Logs
          </Text>
        </View>
        <View
          style={[
            styles.timelineWrapper,
            { backgroundColor: activeColors.card, borderColor: activeColors.border },
          ]}
        >
          {auditLogs.map((activity, idx) => (
            <View key={activity.id} style={styles.timelineRow}>
              <View style={styles.timelineLeftCol}>
                <View style={[styles.timelineDot, { backgroundColor: activeColors.accent }]} />
                {idx < auditLogs.length - 1 && (
                  <View
                    style={[
                      styles.timelineConnectorLine,
                      { backgroundColor: activeColors.border },
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineDescText, { color: activeColors.textMuted }]}>
                  <Text style={[styles.timelineUser, { color: activeColors.text }]}>
                    {activity.user}
                  </Text>{' '}
                  logged {activity.action} on {activity.entityType}
                </Text>
                <Text style={[styles.timelineTimeText, { color: activeColors.textMuted }]}>
                  {new Date(activity.createdAt).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))}
          {auditLogs.length === 0 && (
            <Text style={styles.emptyPlaceholderText}>No audit activity tracked today</Text>
          )}
        </View>
      </ScrollView>

      {/* Modals triggered locally */}
      <AddProjectModal visible={isAddProjectOpen} onClose={() => setIsAddProjectOpen(false)} />
      <TaskModal
        visible={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        editingTask={null}
      />
      <DailyLogModal visible={isDailyLogModalOpen} onClose={() => setIsDailyLogModalOpen(false)} />
    </View>
  );
}
