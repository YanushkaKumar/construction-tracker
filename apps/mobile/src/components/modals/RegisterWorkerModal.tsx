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

interface RegisterWorkerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RegisterWorkerModal({ visible, onClose }: RegisterWorkerModalProps) {
  const { styles, activeColors, handleRegisterWorker } = useAppContext();

  const [workerFormValues, setWorkerFormValues] = useState({
    firstName: '',
    lastName: '',
    nic: '',
    phone: '',
    skillType: 'Labourer',
    dailyRate: '2500',
  });
  const [workerSaving, setWorkerSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setWorkerFormValues({
        firstName: '',
        lastName: '',
        nic: '',
        phone: '',
        skillType: 'Labourer',
        dailyRate: '2500',
      });
    }
  }, [visible]);

  const handleSubmit = async () => {
    const { firstName, lastName, nic, phone, skillType, dailyRate } = workerFormValues;
    if (!firstName || !lastName || !nic) {
      Alert.alert('Error', 'Name and NIC are required');
      return;
    }
    setWorkerSaving(true);
    const success = await handleRegisterWorker({
      firstName,
      lastName,
      nic,
      phone: phone || undefined,
      skillType,
      dailyRate: Number(dailyRate),
    });
    setWorkerSaving(false);
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
              <Text style={styles.modalTitle}>Register Worker Profile</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <X size={20} color={activeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormBody}>
              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>First Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Saman"
                    placeholderTextColor={activeColors.textMuted}
                    value={workerFormValues.firstName}
                    onChangeText={(val) =>
                      setWorkerFormValues({ ...workerFormValues, firstName: val })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Last Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Kumara"
                    placeholderTextColor={activeColors.textMuted}
                    value={workerFormValues.lastName}
                    onChangeText={(val) =>
                      setWorkerFormValues({ ...workerFormValues, lastName: val })
                    }
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>NIC *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="881234567V"
                    placeholderTextColor={activeColors.textMuted}
                    value={workerFormValues.nic}
                    onChangeText={(val) => setWorkerFormValues({ ...workerFormValues, nic: val })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Phone</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="+9478..."
                    placeholderTextColor={activeColors.textMuted}
                    value={workerFormValues.phone}
                    onChangeText={(val) => setWorkerFormValues({ ...workerFormValues, phone: val })}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Skill Trade *</Text>
                  <DropdownSelector
                    label="Skill Trade"
                    value={workerFormValues.skillType}
                    options={[
                      { label: 'Mason', value: 'Mason' },
                      { label: 'Carpenter', value: 'Carpenter' },
                      { label: 'Bar Bender', value: 'Bar Bender' },
                      { label: 'Plumber', value: 'Plumber' },
                      { label: 'Electrician', value: 'Electrician' },
                      { label: 'Labourer', value: 'Labourer' },
                      { label: 'Helper', value: 'Helper' },
                    ]}
                    onSelect={(val) =>
                      setWorkerFormValues({ ...workerFormValues, skillType: val })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Daily Rate (LKR) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="2500"
                    placeholderTextColor={activeColors.textMuted}
                    value={workerFormValues.dailyRate}
                    onChangeText={(val) =>
                      setWorkerFormValues({ ...workerFormValues, dailyRate: val })
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
                disabled={workerSaving}
                activeOpacity={0.7}
              >
                {workerSaving ? (
                  <ActivityIndicator color={activeColors.textDark} />
                ) : (
                  <Text style={styles.submitBtnText}>Register</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
