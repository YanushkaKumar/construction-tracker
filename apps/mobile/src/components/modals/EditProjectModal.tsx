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

interface EditProjectModalProps {
  visible: boolean;
  onClose: () => void;
  projectId: string | null;
}

export function EditProjectModal({ visible, onClose, projectId }: EditProjectModalProps) {
  const { styles, activeColors, projects, handleUpdateProject } = useAppContext();

  const [editProjectFormValues, setEditProjectFormValues] = useState({
    name: '',
    description: '',
    clientName: '',
    clientPhone: '',
    location: '',
    budgetEstimate: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
  });
  const [projectUpdating, setProjectUpdating] = useState(false);

  useEffect(() => {
    if (visible && projectId) {
      const proj = projects.find((p) => p.id === projectId);
      if (proj) {
        setEditProjectFormValues({
          name: proj.name,
          description: proj.description || '',
          clientName: proj.clientName || '',
          clientPhone: proj.clientPhone || '',
          location: proj.location || '',
          budgetEstimate: proj.budgetEstimate.toString(),
          status: proj.status,
          priority: proj.priority,
        });
      }
    }
  }, [projectId, visible, projects]);

  const handleSubmit = async () => {
    if (!projectId) return;
    if (!editProjectFormValues.name.trim()) {
      Alert.alert('Error', 'Project name is required');
      return;
    }
    setProjectUpdating(true);
    const budget = Number(editProjectFormValues.budgetEstimate) || 0;
    const success = await handleUpdateProject(projectId, {
      ...editProjectFormValues,
      budgetEstimate: budget,
    });
    setProjectUpdating(false);
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
              <Text style={styles.modalTitle}>Modify Project Details</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <X size={20} color={activeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormBody}>
              <Text style={styles.formLabel}>Project Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={editProjectFormValues.name}
                onChangeText={(val) =>
                  setEditProjectFormValues({ ...editProjectFormValues, name: val })
                }
              />

              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                multiline
                value={editProjectFormValues.description}
                onChangeText={(val) =>
                  setEditProjectFormValues({ ...editProjectFormValues, description: val })
                }
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Client Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editProjectFormValues.clientName}
                    onChangeText={(val) =>
                      setEditProjectFormValues({ ...editProjectFormValues, clientName: val })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Client Phone</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editProjectFormValues.clientPhone}
                    onChangeText={(val) =>
                      setEditProjectFormValues({ ...editProjectFormValues, clientPhone: val })
                    }
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Location</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editProjectFormValues.location}
                    onChangeText={(val) =>
                      setEditProjectFormValues({ ...editProjectFormValues, location: val })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Budget (LKR)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={editProjectFormValues.budgetEstimate}
                    onChangeText={(val) =>
                      setEditProjectFormValues({ ...editProjectFormValues, budgetEstimate: val })
                    }
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Status</Text>
                  <DropdownSelector
                    label="Status"
                    value={editProjectFormValues.status}
                    options={[
                      { label: 'Planning', value: 'PLANNING' },
                      { label: 'In Progress', value: 'IN_PROGRESS' },
                      { label: 'On Hold', value: 'ON_HOLD' },
                      { label: 'Completed', value: 'COMPLETED' },
                      { label: 'Cancelled', value: 'CANCELLED' },
                    ]}
                    onSelect={(val) =>
                      setEditProjectFormValues({ ...editProjectFormValues, status: val })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Priority</Text>
                  <DropdownSelector
                    label="Priority"
                    value={editProjectFormValues.priority}
                    options={[
                      { label: 'Low', value: 'LOW' },
                      { label: 'Medium', value: 'MEDIUM' },
                      { label: 'High', value: 'HIGH' },
                      { label: 'Urgent', value: 'URGENT' },
                    ]}
                    onSelect={(val) =>
                      setEditProjectFormValues({ ...editProjectFormValues, priority: val })
                    }
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
                disabled={projectUpdating}
                activeOpacity={0.7}
              >
                {projectUpdating ? (
                  <ActivityIndicator color={activeColors.textDark} />
                ) : (
                  <Text style={styles.submitBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
