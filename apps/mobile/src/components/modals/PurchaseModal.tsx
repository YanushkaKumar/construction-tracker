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
import { X, Trash2, Plus } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { DropdownSelector } from '../common/DropdownSelector';

interface PurchaseModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PurchaseModal({ visible, onClose }: PurchaseModalProps) {
  const { styles, activeColors, projects, handleLogPurchase } = useAppContext();

  const [purTitle, setPurTitle] = useState('');
  const [purAmount, setPurAmount] = useState('');
  const [purCategory, setPurCategory] = useState('PROJECT_MATERIAL');
  const [purVendor, setPurVendor] = useState('');
  const [purDesc, setPurDesc] = useState('');
  const [purAllocs, setPurAllocs] = useState<Array<{ projectId: string; amount: string }>>([
    { projectId: '', amount: '' },
  ]);
  const [purSaving, setPurSaving] = useState(false);

  const handleSubmit = async () => {
    if (!purTitle || !purAmount) {
      Alert.alert('Validation Error', 'Please fill in title and amount');
      return;
    }
    const cleanAllocs = purAllocs
      .filter((a) => a.projectId && Number(a.amount) > 0)
      .map((a) => ({ projectId: a.projectId, amount: Number(a.amount) }));

    if (cleanAllocs.length === 0) {
      Alert.alert('Validation Error', 'Please split costs to at least one project');
      return;
    }

    const allocSum = cleanAllocs.reduce((sum, a) => sum + a.amount, 0);
    if (allocSum !== Number(purAmount)) {
      Alert.alert(
        'Allocation Error',
        `Split sum (LKR ${allocSum.toLocaleString()}) must match total amount (LKR ${Number(
          purAmount
        ).toLocaleString()})`
      );
      return;
    }

    setPurSaving(true);
    const success = await handleLogPurchase({
      title: purTitle,
      totalAmount: Number(purAmount),
      category: purCategory,
      vendor: purVendor || undefined,
      description: purDesc || undefined,
      allocations: cleanAllocs,
    });
    setPurSaving(false);
    if (success) {
      setPurTitle('');
      setPurAmount('');
      setPurVendor('');
      setPurDesc('');
      setPurAllocs([{ projectId: '', amount: '' }]);
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
              <Text style={styles.modalTitle}>Log Project Purchase</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <X size={20} color={activeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormBody}>
              <Text style={styles.formLabel}>Title / Item *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Cement bags batch 1"
                placeholderTextColor={activeColors.textMuted}
                value={purTitle}
                onChangeText={setPurTitle}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Total Cost (LKR) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="2500"
                    placeholderTextColor={activeColors.textMuted}
                    keyboardType="numeric"
                    value={purAmount}
                    onChangeText={setPurAmount}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Category *</Text>
                  <DropdownSelector
                    label="Category"
                    value={purCategory}
                    options={[
                      { label: 'Material', value: 'PROJECT_MATERIAL' },
                      { label: 'Shared Tool', value: 'SHARED_TOOL' },
                      { label: 'Daily Expense', value: 'DAILY_EXPENSE' },
                      { label: 'Service', value: 'SERVICE' },
                      { label: 'Transport', value: 'TRANSPORT' },
                      { label: 'Other', value: 'OTHER' },
                    ]}
                    onSelect={(val) => setPurCategory(val)}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Vendor / Store name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ranjan Hardware"
                placeholderTextColor={activeColors.textMuted}
                value={purVendor}
                onChangeText={setPurVendor}
              />

              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Details of the items purchased..."
                placeholderTextColor={activeColors.textMuted}
                multiline
                value={purDesc}
                onChangeText={setPurDesc}
              />

              <View style={styles.allocationSplitSection}>
                <View style={styles.allocationSectionHeader}>
                  <Text style={styles.allocTitle}>Split Cost Across Projects *</Text>
                  <TouchableOpacity
                    style={styles.allocAddRowBtn}
                    onPress={() => setPurAllocs([...purAllocs, { projectId: '', amount: '' }])}
                    activeOpacity={0.7}
                  >
                    <Plus size={12} color={activeColors.accent} />
                    <Text style={styles.allocAddRowText}>Add Project</Text>
                  </TouchableOpacity>
                </View>

                {purAllocs.map((alloc, idx) => (
                  <View key={idx} style={styles.allocationRow}>
                    <DropdownSelector
                      label="Select Site"
                      value={alloc.projectId}
                      options={projects.map((p) => ({ label: p.code, value: p.id }))}
                      onSelect={(val) => {
                        const updated = [...purAllocs];
                        updated[idx].projectId = val;
                        setPurAllocs(updated);
                      }}
                      placeholder="Choose site..."
                      style={{ flex: 1.8, marginRight: 6, marginBottom: 0 }}
                    />
                    <TextInput
                      style={[styles.modalInput, { flex: 1, marginBottom: 0, height: 38 }]}
                      placeholder="Amount"
                      placeholderTextColor={activeColors.textMuted}
                      keyboardType="numeric"
                      value={alloc.amount}
                      onChangeText={(val) => {
                        const updated = [...purAllocs];
                        updated[idx].amount = val;
                        setPurAllocs(updated);
                      }}
                    />
                    {purAllocs.length > 1 && (
                      <TouchableOpacity
                        style={styles.allocDeleteBtn}
                        onPress={() => setPurAllocs(purAllocs.filter((_, i) => i !== idx))}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmit}
                disabled={purSaving}
                activeOpacity={0.7}
              >
                {purSaving ? (
                  <ActivityIndicator color={activeColors.textDark} />
                ) : (
                  <Text style={styles.submitBtnText}>Log Purchase</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
