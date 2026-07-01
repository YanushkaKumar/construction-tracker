import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';

interface RejectionModalProps {
  visible: boolean;
  onClose: () => void;
  expenseId: string | null;
}

export function RejectionModal({ visible, onClose, expenseId }: RejectionModalProps) {
  const { styles, activeColors, handleRejectExpense } = useAppContext();

  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectingSaving, setRejectingSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setRejectionReasonInput('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!expenseId) return;
    if (!rejectionReasonInput.trim()) {
      Alert.alert('Error', 'Please input a reason for rejection.');
      return;
    }
    setRejectingSaving(true);
    const success = await handleRejectExpense(expenseId, rejectionReasonInput);
    setRejectingSaving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContentCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reject Expense voucher</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <X size={20} color={activeColors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalFormBody}>
            <Text style={styles.formLabel}>Rejection Reason *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Exceeds daily budget limit, wrong invoice image..."
              placeholderTextColor={activeColors.textMuted}
              value={rejectionReasonInput}
              onChangeText={setRejectionReasonInput}
            />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: '#f43f5e' }]}
              onPress={handleSubmit}
              disabled={rejectingSaving}
              activeOpacity={0.7}
            >
              {rejectingSaving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={[styles.submitBtnText, { color: '#fff' }]}>Confirm Reject</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
