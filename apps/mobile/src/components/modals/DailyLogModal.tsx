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

interface DailyLogModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DailyLogModal({ visible, onClose }: DailyLogModalProps) {
  const {
    styles,
    activeColors,
    projects,
    dailyLogsFilterProjectId,
    handleCreateDailyLog,
  } = useAppContext();

  const [dailyLogFormValues, setDailyLogFormValues] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    weatherCondition: 'Sunny',
    workSummary: '',
    issues: '',
    safetyNotes: '',
    workersOnSite: '0',
    notes: '',
  });
  const [dailyLogSaving, setDailyLogSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDailyLogFormValues({
        reportDate: new Date().toISOString().split('T')[0],
        weatherCondition: 'Sunny',
        workSummary: '',
        issues: '',
        safetyNotes: '',
        workersOnSite: '0',
        notes: '',
      });
    }
  }, [visible]);

  const handleSubmit = async () => {
    const targetProjId = dailyLogsFilterProjectId || projects[0]?.id;
    if (!targetProjId) {
      Alert.alert('Error', 'No project selected');
      return;
    }
    if (!dailyLogFormValues.workSummary.trim()) {
      Alert.alert('Error', 'Work summary is required');
      return;
    }
    setDailyLogSaving(true);
    const success = await handleCreateDailyLog(targetProjId, {
      ...dailyLogFormValues,
      workersOnSite: parseInt(dailyLogFormValues.workersOnSite) || 0,
    });
    setDailyLogSaving(false);
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
              <Text style={styles.modalTitle}>Submit Daily Site Log</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <X size={20} color={activeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormBody}>
              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Date *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={activeColors.textMuted}
                    value={dailyLogFormValues.reportDate}
                    onChangeText={(val) =>
                      setDailyLogFormValues({ ...dailyLogFormValues, reportDate: val })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Workers *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 15"
                    keyboardType="numeric"
                    placeholderTextColor={activeColors.textMuted}
                    value={dailyLogFormValues.workersOnSite}
                    onChangeText={(val) =>
                      setDailyLogFormValues({ ...dailyLogFormValues, workersOnSite: val })
                    }
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Weather Condition *</Text>
              <DropdownSelector
                label="Weather Condition"
                value={dailyLogFormValues.weatherCondition}
                options={[
                  { label: 'Sunny', value: 'Sunny' },
                  { label: 'Cloudy', value: 'Cloudy' },
                  { label: 'Rainy (Light)', value: 'Rainy (Light)' },
                  { label: 'Rainy (Heavy)', value: 'Rainy (Heavy)' },
                  { label: 'Stormy', value: 'Stormy' },
                ]}
                onSelect={(val) =>
                  setDailyLogFormValues({ ...dailyLogFormValues, weatherCondition: val })
                }
              />

              <Text style={styles.formLabel}>Work Summary *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Summarize site progress..."
                placeholderTextColor={activeColors.textMuted}
                multiline
                value={dailyLogFormValues.workSummary}
                onChangeText={(val) =>
                  setDailyLogFormValues({ ...dailyLogFormValues, workSummary: val })
                }
              />

              <Text style={styles.formLabel}>Issues / Bottlenecks</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea, { height: 50 }]}
                placeholder="Delayed structural steel shipment..."
                placeholderTextColor={activeColors.textMuted}
                multiline
                value={dailyLogFormValues.issues}
                onChangeText={(val) =>
                  setDailyLogFormValues({ ...dailyLogFormValues, issues: val })
                }
              />

              <Text style={styles.formLabel}>Safety Notes</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea, { height: 50 }]}
                placeholder="Routine safety audit notes..."
                placeholderTextColor={activeColors.textMuted}
                multiline
                value={dailyLogFormValues.safetyNotes}
                onChangeText={(val) =>
                  setDailyLogFormValues({ ...dailyLogFormValues, safetyNotes: val })
                }
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmit}
                disabled={dailyLogSaving}
                activeOpacity={0.7}
              >
                {dailyLogSaving ? (
                  <ActivityIndicator color={activeColors.textDark} />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Log</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
