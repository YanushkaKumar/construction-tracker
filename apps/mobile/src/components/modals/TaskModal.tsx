import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { DropdownSelector } from '../common/DropdownSelector';
import { Task } from '../../types';

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  editingTask: Task | null;
}

export function TaskModal({ visible, onClose, editingTask }: TaskModalProps) {
  const {
    styles,
    activeColors,
    projects,
    teamMembers,
    selectedProjectDetailId,
    handleCreateTask,
    handleUpdateTask,
  } = useAppContext();

  const [taskFormValues, setTaskFormValues] = useState({
    projectId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'TODO',
    assigneeId: '',
    dueDate: '',
  });
  const [taskSaving, setTaskSaving] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setTaskFormValues({
        projectId: editingTask.projectId,
        title: editingTask.title,
        description: editingTask.description || '',
        priority: editingTask.priority,
        status: editingTask.status,
        assigneeId: editingTask.assigneeId || '',
        dueDate: editingTask.dueDate ? editingTask.dueDate.split('T')[0] : '',
      });
    } else {
      setTaskFormValues({
        projectId: selectedProjectDetailId || projects[0]?.id || '',
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'TODO',
        assigneeId: '',
        dueDate: '',
      });
    }
  }, [editingTask, visible, projects, selectedProjectDetailId]);

  const handleSubmit = async () => {
    if (!taskFormValues.projectId || !taskFormValues.title) {
      Alert.alert('Error', 'Project and Title are required');
      return;
    }
    setTaskSaving(true);
    let success = false;
    if (editingTask) {
      success = await handleUpdateTask(editingTask.id, taskFormValues);
    } else {
      success = await handleCreateTask(taskFormValues);
    }
    setTaskSaving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%' }}
        >
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTask ? 'Modify Task Details' : 'Create New Task'}
              </Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <X size={20} color={activeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormBody}>
              {!editingTask && (
                <>
                  <Text style={styles.formLabel}>Target Project *</Text>
                  <DropdownSelector
                    label="Select Site"
                    value={taskFormValues.projectId}
                    options={projects.map((p) => ({ label: `${p.code} — ${p.name}`, value: p.id }))}
                    onSelect={(val) => setTaskFormValues({ ...taskFormValues, projectId: val })}
                  />
                </>
              )}

              <Text style={styles.formLabel}>Task Title *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Complete MEP rough-in"
                placeholderTextColor={activeColors.textMuted}
                value={taskFormValues.title}
                onChangeText={(val) => setTaskFormValues({ ...taskFormValues, title: val })}
              />

              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Details about task scope..."
                placeholderTextColor={activeColors.textMuted}
                multiline
                value={taskFormValues.description}
                onChangeText={(val) => setTaskFormValues({ ...taskFormValues, description: val })}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Priority</Text>
                  <DropdownSelector
                    label="Priority"
                    value={taskFormValues.priority}
                    options={[
                      { label: 'Low', value: 'LOW' },
                      { label: 'Medium', value: 'MEDIUM' },
                      { label: 'High', value: 'HIGH' },
                      { label: 'Urgent', value: 'URGENT' },
                    ]}
                    onSelect={(val) => setTaskFormValues({ ...taskFormValues, priority: val })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Status</Text>
                  <DropdownSelector
                    label="Status"
                    value={taskFormValues.status}
                    options={[
                      { label: 'Todo', value: 'TODO' },
                      { label: 'In Progress', value: 'IN_PROGRESS' },
                      { label: 'In Review', value: 'IN_REVIEW' },
                      { label: 'Completed', value: 'COMPLETED' },
                      { label: 'Blocked', value: 'BLOCKED' },
                    ]}
                    onSelect={(val) => setTaskFormValues({ ...taskFormValues, status: val })}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Assignee</Text>
                  <DropdownSelector
                    label="Assignee"
                    value={taskFormValues.assigneeId}
                    options={[
                      { label: 'Unassigned', value: '' },
                      ...teamMembers.map((m) => ({
                        label: `${m.firstName} ${m.lastName}`,
                        value: m.id,
                      })),
                    ]}
                    onSelect={(val) => setTaskFormValues({ ...taskFormValues, assigneeId: val })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Due Date</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={activeColors.textMuted}
                    value={taskFormValues.dueDate}
                    onChangeText={(val) => setTaskFormValues({ ...taskFormValues, dueDate: val })}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmit}
                disabled={taskSaving}
                activeOpacity={0.7}
              >
                {taskSaving ? (
                  <ActivityIndicator color={activeColors.textDark} />
                ) : (
                  <Text style={styles.submitBtnText}>Save Task</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
