import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  FileText,
  Package,
  Users,
  TrendingUp,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

export function MenuScreen() {
  const {
    styles,
    activeColors,
    user,
    isTablet,
    setActiveScreen,
    handleLogout,
  } = useAppContext();

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* User Profile Info card */}
      <View
        style={[
          styles.profileSection,
          { backgroundColor: activeColors.card, borderColor: activeColors.border },
        ]}
      >
        <View
          style={[
            styles.avatarLarge,
            { backgroundColor: activeColors.accentBg, borderColor: activeColors.accent },
          ]}
        >
          <Text style={[styles.avatarLargeText, { color: activeColors.accent }]}>
            {user?.firstName?.charAt(0)}
            {user?.lastName?.charAt(0)}
          </Text>
        </View>
        <Text style={[styles.profileName, { color: activeColors.text }]}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={[styles.profileRole, { color: activeColors.textMuted }]}>
          {user?.roleDisplayName}
        </Text>
        <Text style={[styles.profileEmail, { color: activeColors.textMuted }]}>
          {user?.email}
        </Text>
      </View>

      {/* Hub layout routing buttons */}
      <Text style={[styles.sectionTitle, { marginBottom: 12, color: activeColors.text }]}>
        Operations Modules
      </Text>
      <View style={styles.menuModulesGrid}>
        {[
          { id: 'daily-logs', label: 'Daily Logs', icon: FileText, desc: 'Site reports logs' },
          { id: 'materials', label: 'Materials', icon: Package, desc: 'Stocks & supply' },
          { id: 'workers', label: 'Workers Roster', icon: Users, desc: 'Attendance registry' },
          { id: 'reports', label: 'Analytics', icon: TrendingUp, desc: 'Financial health' },
          { id: 'settings', label: 'Settings', icon: SettingsIcon, desc: 'Company configs' },
        ].map((item) => {
          const IconComp = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setActiveScreen(item.id)}
              style={[
                styles.menuGridItem,
                {
                  width: isTablet ? '31.5%' : '48%',
                  backgroundColor: activeColors.card,
                  borderColor: activeColors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItemIconBox, { backgroundColor: activeColors.accentBg }]}>
                <IconComp size={22} color={activeColors.accent} />
              </View>
              <Text style={[styles.menuItemLabel, { color: activeColors.text }]}>
                {item.label}
              </Text>
              <Text style={[styles.menuItemDesc, { color: activeColors.textMuted }]}>
                {item.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <Text style={styles.logoutButtonText}>Log Out Session</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
