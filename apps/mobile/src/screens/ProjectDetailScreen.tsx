import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Edit2, Plus, Trash2 } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EditProjectModal } from '../components/modals/EditProjectModal';
import { TaskModal } from '../components/modals/TaskModal';
import { DailyLogModal } from '../components/modals/DailyLogModal';

export function ProjectDetailScreen() {
  const {
    styles,
    activeColors,
    projects,
    selectedProjectDetailId,
    setSelectedProjectDetailId,
    projectDetailSubTab,
    setProjectDetailSubTab,
    tasks,
    dailyLogs,
    materialRequests,
    teamMembers,
    handleDeleteTask,
    setActiveScreen,
    setDailyLogsFilterProjectId,
    fmt,
  } = useAppContext();

  // Local modal triggers
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDailyLogModalOpen, setIsDailyLogModalOpen] = useState(false);

  const targetProj = projects.find((p) => p.id === selectedProjectDetailId);

  if (!targetProj) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={activeColors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Custom Detail Navigation bar header */}
      <View style={[styles.detailHeaderBar, { borderBottomColor: activeColors.border }]}>
        <TouchableOpacity
          onPress={() => {
            setSelectedProjectDetailId(null);
            setActiveScreen('projects');
          }}
          style={styles.backButtonTrigger}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={activeColors.accent} />
          <Text style={{ color: activeColors.accent, fontSize: 14, fontWeight: 'bold' }}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', marginRight: 40 }}>
          <Text style={[styles.detailHeaderTitle, { color: activeColors.text }]} numberOfLines={1}>
            {targetProj.name}
          </Text>
          <Text style={styles.detailHeaderSubtitle}>{targetProj.code}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsEditProjectOpen(true)}
          style={[
            styles.detailEditButton,
            { backgroundColor: activeColors.card, borderColor: activeColors.border },
          ]}
          activeOpacity={0.7}
        >
          <Edit2 size={16} color={activeColors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Tab view subnav selectors */}
      <View
        style={[
          styles.detailTabSelectorRail,
          { backgroundColor: activeColors.headerBg, borderBottomColor: activeColors.border },
        ]}
      >
        {['info', 'tasks', 'logs', 'finance', 'team'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.detailTabHeaderItem,
              projectDetailSubTab === tab && { borderBottomColor: activeColors.accent },
            ]}
            onPress={() => setProjectDetailSubTab(tab as any)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.detailTabHeaderText,
                projectDetailSubTab === tab
                  ? { color: activeColors.accent, fontWeight: 'bold' }
                  : { color: activeColors.textMuted },
              ]}
            >
              {tab === 'logs' ? 'Daily Logs' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {projectDetailSubTab === 'info' && (
          <View
            style={[
              styles.premiumCardItem,
              { backgroundColor: activeColors.card, borderColor: activeColors.border },
            ]}
          >
            <Text style={[styles.cardHeaderTitle, { color: activeColors.text }]}>Metadata</Text>

            <Text style={styles.infoFieldLabel}>Description</Text>
            <Text style={[styles.infoFieldValue, { color: activeColors.text }]}>
              {targetProj.description || 'No description recorded.'}
            </Text>

            <Text style={styles.infoFieldLabel}>Client Info</Text>
            <Text style={[styles.infoFieldValue, { color: activeColors.text }]}>
              {targetProj.clientName || 'N/A'}{' '}
              {targetProj.clientPhone ? `(${targetProj.clientPhone})` : ''}
            </Text>

            <Text style={styles.infoFieldLabel}>Location</Text>
            <Text style={[styles.infoFieldValue, { color: activeColors.text }]}>
              {targetProj.location || 'Unknown'}
            </Text>

            <View style={styles.infoDoubleGridRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoFieldLabel}>Project Status</Text>
                <StatusBadge type="status" value={targetProj.status} style={{ marginTop: 4 }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoFieldLabel}>Priority Rank</Text>
                <StatusBadge type="priority" value={targetProj.priority} style={{ marginTop: 4 }} />
              </View>
            </View>
          </View>
        )}

        {projectDetailSubTab === 'tasks' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: activeColors.text }]}>Task Roster</Text>
              <TouchableOpacity
                style={[styles.premiumHeaderButton, { backgroundColor: activeColors.accent }]}
                onPress={() => setIsTaskModalOpen(true)}
                activeOpacity={0.7}
              >
                <Plus size={12} color={activeColors.textDark} />
                <Text style={[styles.premiumHeaderBtnText, { color: activeColors.textDark }]}>
                  Add Task
                </Text>
              </TouchableOpacity>
            </View>
            {tasks.map((task) => (
              <View
                key={task.id}
                style={[
                  styles.premiumCardItem,
                  { backgroundColor: activeColors.card, borderColor: activeColors.border },
                ]}
              >
                <View style={styles.projectHeaderRow}>
                  <Text style={[styles.taskTitleText, { color: activeColors.text }]}>
                    {task.title}
                  </Text>
                  <StatusBadge type="status" value={task.status} />
                </View>
                <Text style={[styles.taskDescText, { color: activeColors.textMuted }]}>
                  {task.description || 'No description provided.'}
                </Text>
                <View style={[styles.taskRowFooter, { borderTopColor: activeColors.borderMuted }]}>
                  <Text style={[styles.taskAssigneeText, { color: activeColors.textMuted }]}>
                    Assignee:{' '}
                    {task.assignee
                      ? `${task.assignee.firstName} ${task.assignee.lastName}`
                      : 'Unassigned'}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteTask(task.id)} activeOpacity={0.7}>
                    <Trash2 size={16} color="#f43f5e" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {tasks.length === 0 && (
              <Text style={[styles.emptyPlaceholderText, { color: activeColors.textMuted }]}>
                No tasks logged for this site
              </Text>
            )}
          </View>
        )}

        {projectDetailSubTab === 'logs' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: activeColors.text }]}>
                Site Activity Logs
              </Text>
              <TouchableOpacity
                style={[styles.premiumHeaderButton, { backgroundColor: activeColors.accent }]}
                onPress={() => {
                  setDailyLogsFilterProjectId(targetProj.id);
                  setIsDailyLogModalOpen(true);
                }}
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
                <View style={[styles.logRowFooter, { borderTopColor: activeColors.borderMuted }]}>
                  <Text style={[styles.logMetaDetails, { color: activeColors.textMuted }]}>
                    Crew Size: {log.workersOnSite}
                  </Text>
                  <Text style={[styles.logMetaDetails, { color: activeColors.textMuted }]}>
                    By: {log.reporter?.firstName} {log.reporter?.lastName}
                  </Text>
                </View>
              </View>
            ))}
            {dailyLogs.length === 0 && (
              <Text style={[styles.emptyPlaceholderText, { color: activeColors.textMuted }]}>
                No logs submitted today
              </Text>
            )}
          </View>
        )}

        {projectDetailSubTab === 'finance' && (
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 12, color: activeColors.text }]}>
              Procurement Ledger
            </Text>
            {materialRequests.map((req) => (
              <View
                key={req.id}
                style={[
                  styles.premiumCardItem,
                  { backgroundColor: activeColors.card, borderColor: activeColors.border },
                ]}
              >
                <View style={styles.projectHeaderRow}>
                  <Text style={[styles.taskTitleText, { color: activeColors.text }]}>
                    {req.material?.name}
                  </Text>
                  <Text style={styles.premiumEarningsEstimate}>{fmt(req.totalPrice || 0)}</Text>
                </View>
                <View style={[styles.taskRowFooter, { borderTopColor: activeColors.borderMuted }]}>
                  <Text style={[styles.taskAssigneeText, { color: activeColors.textMuted }]}>
                    Quantity: {req.quantity} {req.material?.unit}
                  </Text>
                  <StatusBadge type="status" value={req.status} />
                </View>
              </View>
            ))}
            {materialRequests.length === 0 && (
              <Text style={[styles.emptyPlaceholderText, { color: activeColors.textMuted }]}>
                No site requisitions registered
              </Text>
            )}
          </View>
        )}

        {projectDetailSubTab === 'team' && (
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 12, color: activeColors.text }]}>
              Assigned Engineers
            </Text>
            {teamMembers.map((member) => (
              <View
                key={member.id}
                style={[
                  styles.memberCard,
                  { backgroundColor: activeColors.card, borderColor: activeColors.border },
                ]}
              >
                <View style={styles.memberInfoCol}>
                  <Text style={[styles.memberName, { color: activeColors.text }]}>
                    {member.firstName} {member.lastName}
                  </Text>
                  <Text style={[styles.memberEmail, { color: activeColors.textMuted }]}>
                    {member.email}
                  </Text>
                </View>
                <View style={styles.memberRoleBadge}>
                  <Text style={styles.roleBadgeText}>{member.role?.displayName}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail screen overlay modals */}
      <EditProjectModal
        visible={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        projectId={selectedProjectDetailId}
      />
      <TaskModal
        visible={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        editingTask={null}
      />
      <DailyLogModal visible={isDailyLogModalOpen} onClose={() => setIsDailyLogModalOpen(false)} />
    </View>
  );
}
