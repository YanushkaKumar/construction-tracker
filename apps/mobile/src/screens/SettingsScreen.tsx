import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Plus, Edit2, Trash2 } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { AddUserModal } from '../components/modals/AddUserModal';
import { EditUserModal } from '../components/modals/EditUserModal';
import { UserMember } from '../types';

export function SettingsScreen() {
  const {
    styles,
    activeColors,
    user,
    company,
    teamMembers,
    handleUpdateCompany,
    handleDeleteUser,
    setActiveScreen,
  } = useAppContext();

  // Local draft states
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [companyUpdating, setCompanyUpdating] = useState(false);

  // Local modal triggers
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserMember | null>(null);

  const canManageTeam =
    user?.role === 'COMPANY_OWNER' || user?.role === 'PROJECT_MANAGER';

  useEffect(() => {
    if (company) {
      setCompanyNameInput(company.name || '');
    }
  }, [company]);

  const onUpdateCompany = async () => {
    if (!companyNameInput.trim()) {
      return;
    }
    setCompanyUpdating(true);
    await handleUpdateCompany(companyNameInput);
    setCompanyUpdating(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.premiumCardItem,
            { backgroundColor: activeColors.card, borderColor: activeColors.border, marginBottom: 20 },
          ]}
        >
          <Text style={[styles.cardHeaderTitle, { color: activeColors.text }]}>
            Company Details
          </Text>
          <Text style={[styles.formLabel, { color: activeColors.textMuted }]}>Company Name</Text>
          <TextInput
            style={[
              styles.modalInput,
              {
                backgroundColor:
                  user?.role === 'COMPANY_OWNER' ? activeColors.inputBg : activeColors.background,
                borderColor: activeColors.inputBorder,
                color: user?.role === 'COMPANY_OWNER' ? activeColors.text : activeColors.textMuted,
                marginBottom: 0,
              },
            ]}
            value={companyNameInput}
            onChangeText={setCompanyNameInput}
            editable={user?.role === 'COMPANY_OWNER'}
            placeholder="e.g. Lanka Build Ltd"
            placeholderTextColor="#71717a"
          />
          {user?.role === 'COMPANY_OWNER' && (
            <TouchableOpacity
              style={[
                styles.modalSubmitBtn,
                { backgroundColor: activeColors.accent, marginTop: 12, height: 38 },
              ]}
              onPress={onUpdateCompany}
              disabled={companyUpdating}
              activeOpacity={0.7}
            >
              {companyUpdating ? (
                <ActivityIndicator size="small" color={activeColors.textDark} />
              ) : (
                <Text style={[styles.submitBtnText, { color: activeColors.textDark }]}>
                  Update Company Profile
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: activeColors.text }]}>
            Company User Roster
          </Text>
          {canManageTeam && (
            <TouchableOpacity
              style={[styles.premiumHeaderButton, { backgroundColor: activeColors.accent }]}
              onPress={() => setIsAddUserOpen(true)}
              activeOpacity={0.7}
            >
              <Plus size={14} color={activeColors.textDark} />
              <Text style={[styles.premiumHeaderBtnText, { color: activeColors.textDark }]}>
                Add User
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {teamMembers.map((member) => (
          <View
            key={member.id}
            style={[
              styles.memberCard,
              { backgroundColor: activeColors.card, borderColor: activeColors.border },
            ]}
          >
            <View style={styles.memberInfoCol}>
              <Text style={[styles.memberName, { color: activeColors.text }]}>
                {member.firstName} {member.lastName}
              </Text>
              <Text style={[styles.memberEmail, { color: activeColors.textMuted }]}>
                {member.email}
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.memberRoleBadge}>
                  <Text style={styles.roleBadgeText}>{member.role?.displayName}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    member.isActive ? styles.bgActive : styles.bgInactive,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>{member.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
              </View>
            </View>

            {canManageTeam && (
              <View style={styles.memberActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionIconButton,
                    { backgroundColor: activeColors.background, borderColor: activeColors.border },
                  ]}
                  onPress={() => {
                    setSelectedUser(member);
                    setIsEditUserOpen(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Edit2 size={13} color={activeColors.textMuted} />
                </TouchableOpacity>
                {user?.id !== member.id && (
                  <TouchableOpacity
                    style={[
                      styles.actionIconButton,
                      { backgroundColor: activeColors.background, borderColor: activeColors.border },
                    ]}
                    onPress={() => handleDeleteUser(member.id, member.firstName)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={13} color="#f43f5e" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={[
            styles.modalCancelBtn,
            { backgroundColor: activeColors.card, borderColor: activeColors.border, marginTop: 20 },
          ]}
          onPress={() => setActiveScreen('menu')}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelBtnText, { color: activeColors.text }]}>Back to Hub Menu</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Local modals */}
      <AddUserModal visible={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} />
      <EditUserModal
        visible={isEditUserOpen}
        onClose={() => {
          setIsEditUserOpen(false);
          setSelectedUser(null);
        }}
        selectedUser={selectedUser}
      />
    </View>
  );
}
