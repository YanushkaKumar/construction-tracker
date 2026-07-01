import React, { useState } from 'react';
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

interface AdvanceModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AdvanceModal({ visible, onClose }: AdvanceModalProps) {
  const { styles, activeColors, projects, handleRecordAdvance } = useAppContext();

  const [advProjectId, setAdvProjectId] = useState('');
  const [advAmount, setAdvAmount] = useState('');
  const [advDesc, setAdvDesc] = useState('');
  const [advRef, setAdvRef] = useState('');
  const [advNotes, setAdvNotes] = useState('');
  const [advSaving, setAdvSaving] = useState(false);

  const handleSubmit = async () => {
    if (!advProjectId || !advAmount || !advDesc) {
      Alert.alert('Validation Error', 'Please enter project, amount and description');
      return;
    }
    setAdvSaving(true);
    const success = await handleRecordAdvance(
      advProjectId,
      Number(advAmount),
      advDesc,
      advRef,
      advNotes
    );
    setAdvSaving(false);
    if (success) {
      setAdvProjectId('');
      setAdvAmount('');
      setAdvDesc('');
      setAdvRef('');
      setAdvNotes('');
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
              <Text style={styles.modalTitle}>Record Project Advance</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <X size={20} color={activeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormBody}>
              <Text style={styles.formLabel}>Target Project *</Text>
              <DropdownSelector
                label="Target Project"
                value={advProjectId}
                options={projects.map((p) => ({ label: `${p.code} — ${p.name}`, value: p.id }))}
                onSelect={(val) => setAdvProjectId(val)}
                placeholder="Select project..."
              />

              <Text style={styles.formLabel}>Amount (LKR) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 500000"
                placeholderTextColor={activeColors.textMuted}
                keyboardType="numeric"
                value={advAmount}
                onChangeText={setAdvAmount}
              />

              <Text style={styles.formLabel}>Description *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Advance payment from client"
                placeholderTextColor={activeColors.textMuted}
                value={advDesc}
                onChangeText={setAdvDesc}
              />

              <Text style={styles.formLabel}>Reference No. (e.g. Check No)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="CHQ-2026-001"
                placeholderTextColor={activeColors.textMuted}
                value={advRef}
                onChangeText={setAdvRef}
              />

              <Text style={styles.formLabel}>Internal Notes</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Additional comments..."
                placeholderTextColor={activeColors.textMuted}
                multiline
                value={advNotes}
                onChangeText={setAdvNotes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmit}
                disabled={advSaving}
                activeOpacity={0.7}
              >
                {advSaving ? (
                  <ActivityIndicator color={activeColors.textDark} />
                ) : (
                  <Text style={styles.submitBtnText}>Record</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
