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

interface MaterialRequestModalProps {
  visible: boolean;
  onClose: () => void;
}

export function MaterialRequestModal({ visible, onClose }: MaterialRequestModalProps) {
  const {
    styles,
    activeColors,
    projects,
    materialsCatalog,
    suppliers,
    materialsFilterProjectId,
    handleCreateMaterialRequest,
  } = useAppContext();

  const [materialRequestFormValues, setMaterialRequestFormValues] = useState({
    materialId: '',
    supplierId: '',
    quantity: '',
    notes: '',
  });
  const [materialRequestSaving, setMaterialRequestSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setMaterialRequestFormValues({
        materialId: '',
        supplierId: '',
        quantity: '',
        notes: '',
      });
    }
  }, [visible]);

  const handleSubmit = async () => {
    const targetProjId = materialsFilterProjectId || projects[0]?.id;
    if (!targetProjId) {
      Alert.alert('Error', 'No project selected');
      return;
    }
    if (!materialRequestFormValues.materialId || !materialRequestFormValues.quantity) {
      Alert.alert('Error', 'Material and Quantity are required');
      return;
    }
    setMaterialRequestSaving(true);
    const success = await handleCreateMaterialRequest(targetProjId, {
      materialId: materialRequestFormValues.materialId,
      supplierId: materialRequestFormValues.supplierId || undefined,
      quantity: Number(materialRequestFormValues.quantity),
      notes: materialRequestFormValues.notes || undefined,
    });
    setMaterialRequestSaving(false);
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
              <Text style={styles.modalTitle}>Request Site Materials</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <X size={20} color={activeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormBody}>
              <Text style={styles.formLabel}>Material Item *</Text>
              <DropdownSelector
                label="Choose Material"
                value={materialRequestFormValues.materialId}
                options={materialsCatalog.map((m) => ({
                  label: `${m.name} (${m.unit})`,
                  value: m.id,
                }))}
                onSelect={(val) =>
                  setMaterialRequestFormValues({ ...materialRequestFormValues, materialId: val })
                }
              />

              <Text style={styles.formLabel}>Preferred Supplier</Text>
              <DropdownSelector
                label="Choose Supplier"
                value={materialRequestFormValues.supplierId}
                options={[
                  { label: 'None', value: '' },
                  ...suppliers.map((s) => ({ label: s.name, value: s.id })),
                ]}
                onSelect={(val) =>
                  setMaterialRequestFormValues({ ...materialRequestFormValues, supplierId: val })
                }
              />

              <Text style={styles.formLabel}>Quantity *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 50"
                keyboardType="numeric"
                placeholderTextColor={activeColors.textMuted}
                value={materialRequestFormValues.quantity}
                onChangeText={(val) =>
                  setMaterialRequestFormValues({ ...materialRequestFormValues, quantity: val })
                }
              />

              <Text style={styles.formLabel}>Delivery Remarks</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Deliver to site storage floor 2..."
                placeholderTextColor={activeColors.textMuted}
                multiline
                value={materialRequestFormValues.notes}
                onChangeText={(val) =>
                  setMaterialRequestFormValues({ ...materialRequestFormValues, notes: val })
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
                disabled={materialRequestSaving}
                activeOpacity={0.7}
              >
                {materialRequestSaving ? (
                  <ActivityIndicator color={activeColors.textDark} />
                ) : (
                  <Text style={styles.submitBtnText}>Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
