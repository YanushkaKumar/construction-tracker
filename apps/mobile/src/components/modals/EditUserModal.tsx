import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { DropdownSelector } from '../common/DropdownSelector';
import { UserMember } from '../../types';

interface EditUserModalProps {
  visible: boolean;
  onClose: () => void;
  selectedUser: UserMember | null;
}

export function EditUserModal({ visible, onClose, selectedUser }: EditUserModalProps) {
  const { styles, activeColors, roles, handleEditUser } = useAppContext();

  const [editUserValues, setEditUserValues] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    roleId: '',
    isActive: true,
  });
  const [editUserSaving, setEditUserSaving] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      setEditUserValues({
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        phone: selectedUser.phone || '',
        roleId: selectedUser.roleId,
        isActive: selectedUser.isActive,
      });
    }
  }, [selectedUser, visible]);

  const handleSubmit = async () => {
    if (!selectedUser) return;
    const { firstName, lastName, roleId } = editUserValues;
    if (!firstName || !lastName || !roleId) {
      Alert.alert('Validation Error', 'Name and Role are required');
      return;
    }
    setEditUserSaving(true);
    const success = await handleEditUser(selectedUser.id, editUserValues);
    setEditUserSaving(false);
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
              <Text style={styles.modalTitle}>Modify Team Account</Text>
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
                    placeholder="Kasun"
                    placeholderTextColor={activeColors.textMuted}
                    value={editUserValues.firstName}
                    onChangeText={(val) =>
                      setEditUserValues({ ...editUserValues, firstName: val })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Last Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Silva"
                    placeholderTextColor={activeColors.textMuted}
                    value={editUserValues.lastName}
                    onChangeText={(val) =>
                      setEditUserValues({ ...editUserValues, lastName: val })
                    }
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Phone Contact</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="+94773456789"
                    placeholderTextColor={activeColors.textMuted}
                    value={editUserValues.phone}
                    onChangeText={(val) => setEditUserValues({ ...editUserValues, phone: val })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Role Assignment *</Text>
                  <DropdownSelector
                    label="Role Assignment"
                    value={editUserValues.roleId}
                    options={roles.map((r) => ({ label: r.displayName, value: r.id }))}
                    onSelect={(val) => setEditUserValues({ ...editUserValues, roleId: val })}
                    placeholder="Choose role..."
                  />
                </View>
              </View>

              <View style={styles.statusSwitchRow}>
                <Text style={styles.statusSwitchLabel}>Account Active Status</Text>
                <Switch
                  value={editUserValues.isActive}
                  onValueChange={(val) => setEditUserValues({ ...editUserValues, isActive: val })}
                  trackColor={{ false: '#27272a', true: activeColors.accent }}
                  thumbColor={editUserValues.isActive ? activeColors.card : activeColors.textMuted}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmit}
                disabled={editUserSaving}
                activeOpacity={0.7}
              >
                {editUserSaving ? (
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
