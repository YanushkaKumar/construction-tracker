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

interface AddProjectModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddProjectModal({ visible, onClose }: AddProjectModalProps) {
  const { styles, activeColors, handleCreateProject } = useAppContext();

  const [projectFormValues, setProjectFormValues] = useState({
    name: '',
    description: '',
    clientName: '',
    clientPhone: '',
    location: '',
    budgetEstimate: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
  });
  const [projectCreating, setProjectCreating] = useState(false);

  useEffect(() => {
    if (visible) {
      setProjectFormValues({
        name: '',
        description: '',
        clientName: '',
        clientPhone: '',
        location: '',
        budgetEstimate: '',
        status: 'PLANNING',
        priority: 'MEDIUM',
      });
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!projectFormValues.name.trim()) {
      Alert.alert('Error', 'Project name is required');
      return;
    }
    setProjectCreating(true);
    const budget = Number(projectFormValues.budgetEstimate) || 0;
    const success = await handleCreateProject({
      ...projectFormValues,
      budgetEstimate: budget,
    });
    setProjectCreating(false);
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
              <Text style={styles.modalTitle}>Create New Project</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <X size={20} color={activeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormBody}>
              <Text style={styles.formLabel}>Project Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Colombo Commercial Plaza"
                placeholderTextColor={activeColors.textMuted}
                value={projectFormValues.name}
                onChangeText={(val) => setProjectFormValues({ ...projectFormValues, name: val })}
              />

              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Brief summary of project scope..."
                placeholderTextColor={activeColors.textMuted}
                multiline
                value={projectFormValues.description}
                onChangeText={(val) =>
                  setProjectFormValues({ ...projectFormValues, description: val })
                }
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Client Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. John Doe"
                    placeholderTextColor={activeColors.textMuted}
                    value={projectFormValues.clientName}
                    onChangeText={(val) =>
                      setProjectFormValues({ ...projectFormValues, clientName: val })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Client Phone</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. +94771234567"
                    placeholderTextColor={activeColors.textMuted}
                    value={projectFormValues.clientPhone}
                    onChangeText={(val) =>
                      setProjectFormValues({ ...projectFormValues, clientPhone: val })
                    }
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Location</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Galle Road, Colombo 3"
                    placeholderTextColor={activeColors.textMuted}
                    value={projectFormValues.location}
                    onChangeText={(val) =>
                      setProjectFormValues({ ...projectFormValues, location: val })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Budget Estimate (LKR)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 15000000"
                    placeholderTextColor={activeColors.textMuted}
                    keyboardType="numeric"
                    value={projectFormValues.budgetEstimate}
                    onChangeText={(val) =>
                      setProjectFormValues({ ...projectFormValues, budgetEstimate: val })
                    }
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Status</Text>
                  <DropdownSelector
                    label="Status"
                    value={projectFormValues.status}
                    options={[
                      { label: 'Planning', value: 'PLANNING' },
                      { label: 'In Progress', value: 'IN_PROGRESS' },
                      { label: 'On Hold', value: 'ON_HOLD' },
                      { label: 'Completed', value: 'COMPLETED' },
                      { label: 'Cancelled', value: 'CANCELLED' },
                    ]}
                    onSelect={(val) => setProjectFormValues({ ...projectFormValues, status: val })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Priority</Text>
                  <DropdownSelector
                    label="Priority"
                    value={projectFormValues.priority}
                    options={[
                      { label: 'Low', value: 'LOW' },
                      { label: 'Medium', value: 'MEDIUM' },
                      { label: 'High', value: 'HIGH' },
                      { label: 'Urgent', value: 'URGENT' },
                    ]}
                    onSelect={(val) =>
                      setProjectFormValues({ ...projectFormValues, priority: val })
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
                disabled={projectCreating}
                activeOpacity={0.7}
              >
                {projectCreating ? (
                  <ActivityIndicator color={activeColors.textDark} />
                ) : (
                  <Text style={styles.submitBtnText}>Create Project</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
