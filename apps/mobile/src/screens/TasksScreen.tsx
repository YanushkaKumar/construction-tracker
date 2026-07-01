import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Plus, Edit2, Trash2 } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { DropdownSelector } from '../components/common/DropdownSelector';
import { StatusBadge } from '../components/common/StatusBadge';
import { TaskModal } from '../components/modals/TaskModal';
import { Task } from '../types';

export function TasksScreen() {
  const {
    styles,
    activeColors,
    theme,
    projects,
    tasks,
    taskFilterProjectId,
    setTaskFilterProjectId,
    selectedKanbanStatus,
    setSelectedKanbanStatus,
    handleDeleteTask,
  } = useAppContext();

  // Local state for adding/editing tasks
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const activeTasks = tasks.filter((t) => t.status === selectedKanbanStatus);

  return (
    <View style={{ flex: 1 }}>
      {/* Responsive project filter bar */}
      <View
        style={[
          styles.filterBarContainer,
          { backgroundColor: activeColors.headerBg, borderBottomColor: activeColors.border },
        ]}
      >
        <DropdownSelector
          label="Site Filter"
          value={taskFilterProjectId}
          options={[
            { label: 'All Construction Sites', value: '' },
            ...projects.map((p) => ({ label: p.code, value: p.id })),
          ]}
          onSelect={setTaskFilterProjectId}
          placeholder="Choose Site..."
          style={{ marginBottom: 0 }}
        />
      </View>

      {/* Horizontal Column sliders for Kanban simulation */}
      <View
        style={[
          styles.horizontalKanbanSelectorContainer,
          { backgroundColor: activeColors.headerBg, borderBottomColor: activeColors.border },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'].map((status) => {
            const count = tasks.filter((t) => t.status === status).length;
            const isActive = selectedKanbanStatus === status;
            return (
              <TouchableOpacity
                key={status}
                onPress={() => setSelectedKanbanStatus(status)}
                style={[
                  styles.kanbanColumnHeaderItem,
                  { backgroundColor: activeColors.card, borderColor: activeColors.border },
                  isActive && { backgroundColor: activeColors.accent, borderColor: 'transparent' },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.kanbanColumnHeaderText,
                    { color: activeColors.textMuted },
                    isActive && { color: activeColors.textDark, fontWeight: '800' },
                  ]}
                >
                  {status.replace('_', ' ')}
                </Text>
                <View
                  style={[
                    styles.kanbanCountBubble,
                    { backgroundColor: theme === 'dark' ? '#27272a' : '#e4e4e7' },
                    isActive && { backgroundColor: 'rgba(0, 0, 0, 0.15)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.kanbanCountBubbleText,
                      { color: activeColors.textMuted },
                      isActive && { color: activeColors.textDark, fontWeight: '800' },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Kanban Active Column Tasks lists */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: activeColors.text }]}>
            {selectedKanbanStatus.replace('_', ' ')} list
          </Text>
          <TouchableOpacity
            style={[styles.premiumHeaderButton, { backgroundColor: activeColors.accent }]}
            onPress={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            activeOpacity={0.7}
          >
            <Plus size={12} color={activeColors.textDark} />
            <Text style={[styles.premiumHeaderBtnText, { color: activeColors.textDark }]}>
              Add Task
            </Text>
          </TouchableOpacity>
        </View>

        {activeTasks.map((task) => (
          <View
            key={task.id}
            style={[
              styles.premiumCardItem,
              { backgroundColor: activeColors.card, borderColor: activeColors.border },
            ]}
          >
            <View style={styles.projectHeaderRow}>
              <Text style={[styles.taskTitleText, { color: activeColors.text }]}>{task.title}</Text>
              <StatusBadge type="priority" value={task.priority} />
            </View>
            <Text style={[styles.taskDescText, { color: activeColors.textMuted }]}>
              {task.description || 'No description details logged.'}
            </Text>
            {task.dueDate && (
              <Text style={[styles.taskDueDateLabel, { color: activeColors.textMuted }]}>
                🗓️ Due: {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            )}

            <View style={[styles.taskCardActionRow, { borderTopColor: activeColors.borderMuted }]}>
              <Text style={[styles.taskAssigneeText, { color: activeColors.textMuted }]}>
                Assignee:{' '}
                {task.assignee
                  ? `${task.assignee.firstName} ${task.assignee.lastName}`
                  : 'Unassigned'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingTask(task);
                    setIsTaskModalOpen(true);
                  }}
                  style={styles.iconButtonContainer}
                  activeOpacity={0.7}
                >
                  <Edit2 size={13} color={activeColors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteTask(task.id)}
                  style={styles.iconButtonContainer}
                  activeOpacity={0.7}
                >
                  <Trash2 size={13} color="#f43f5e" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {activeTasks.length === 0 && (
          <Text style={[styles.emptyPlaceholderText, { color: activeColors.textMuted }]}>
            No tasks found in this category column
          </Text>
        )}
      </ScrollView>

      <TaskModal
        visible={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        editingTask={editingTask}
      />
    </View>
  );
}
