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

interface AddUserModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddUserModal({ visible, onClose }: AddUserModalProps) {
  const { styles, activeColors, roles, handleAddUser } = useAppContext();

  const [addUserValues, setAddUserValues] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    roleId: '',
  });
  const [addUserSaving, setAddUserSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setAddUserValues({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        roleId: '',
      });
    }
  }, [visible]);

  const handleSubmit = async () => {
    const { email, password, firstName, lastName, roleId } = addUserValues;
    if (!email || !password || !firstName || !lastName || !roleId) {
      Alert.alert('Validation Error', 'Please fill all required (*) fields');
      return;
    }
    setAddUserSaving(true);
    const success = await handleAddUser(addUserValues);
    setAddUserSaving(false);
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
              <Text style={styles.modalTitle}>Add Company User</Text>
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
                    value={addUserValues.firstName}
                    onChangeText={(val) =>
                      setAddUserValues({ ...addUserValues, firstName: val })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Last Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Silva"
                    placeholderTextColor={activeColors.textMuted}
                    value={addUserValues.lastName}
                    onChangeText={(val) =>
                      setAddUserValues({ ...addUserValues, lastName: val })
                    }
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Email Address *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="kasun@lankabuild.lk"
                placeholderTextColor={activeColors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={addUserValues.email}
                onChangeText={(val) => setAddUserValues({ ...addUserValues, email: val })}
              />

              <Text style={styles.formLabel}>Initial Password *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="••••••••"
                placeholderTextColor={activeColors.textMuted}
                secureTextEntry
                value={addUserValues.password}
                onChangeText={(val) => setAddUserValues({ ...addUserValues, password: val })}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Phone Contact</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="+94773456789"
                    placeholderTextColor={activeColors.textMuted}
                    value={addUserValues.phone}
                    onChangeText={(val) => setAddUserValues({ ...addUserValues, phone: val })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Role Assignment *</Text>
                  <DropdownSelector
                    label="Role Assignment"
                    value={addUserValues.roleId}
                    options={roles.map((r) => ({ label: r.displayName, value: r.id }))}
                    onSelect={(val) => setAddUserValues({ ...addUserValues, roleId: val })}
                    placeholder="Choose role..."
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
                disabled={addUserSaving}
                activeOpacity={0.7}
              >
                {addUserSaving ? (
                  <ActivityIndicator color={activeColors.textDark} />
                ) : (
                  <Text style={styles.submitBtnText}>Add User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
