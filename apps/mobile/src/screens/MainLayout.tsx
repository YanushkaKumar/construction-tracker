import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  Wallet,
  Menu,
  Sun,
  Moon,
  Activity,
} from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { LoginScreen } from './LoginScreen';
import { DashboardScreen } from './DashboardScreen';
import { ProjectsScreen } from './ProjectsScreen';
import { ProjectDetailScreen } from './ProjectDetailScreen';
import { TasksScreen } from './TasksScreen';
import { FinanceScreen } from './FinanceScreen';
import { DailyLogsScreen } from './DailyLogsScreen';
import { MaterialsScreen } from './MaterialsScreen';
import { WorkersScreen } from './WorkersScreen';
import { ReportsScreen } from './ReportsScreen';
import { MenuScreen } from './MenuScreen';
import { SettingsScreen } from './SettingsScreen';

export function MainLayout() {
  const {
    theme,
    setTheme,
    activeColors,
    styles,
    token,
    company,
    user,
    dataLoading,
    refreshData,
    activeScreen,
    setActiveScreen,
  } = useAppContext();

  if (!token) {
    return <LoginScreen />;
  }

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'projects':
        return <ProjectsScreen />;
      case 'project-detail':
        return <ProjectDetailScreen />;
      case 'tasks':
        return <TasksScreen />;
      case 'finance':
        return <FinanceScreen />;
      case 'daily-logs':
        return <DailyLogsScreen />;
      case 'materials':
        return <MaterialsScreen />;
      case 'workers':
        return <WorkersScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'menu':
        return <MenuScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.appContainer, { backgroundColor: activeColors.background }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={activeColors.headerBg}
      />
      {activeScreen !== 'project-detail' && (
        <View
          style={[
            styles.header,
            { backgroundColor: activeColors.headerBg, borderBottomColor: activeColors.border },
          ]}
        >
          <View>
            <Text style={[styles.headerTitle, { color: activeColors.text }]}>
              {company?.name || 'BuildTrack'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: activeColors.textMuted }]}>
              {user?.firstName} {user?.lastName} ({user?.roleDisplayName})
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[
                styles.refreshButton,
                { backgroundColor: activeColors.card, borderColor: activeColors.border },
              ]}
              onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              activeOpacity={0.7}
            >
              {theme === 'dark' ? (
                <Sun size={18} color={activeColors.accent} />
              ) : (
                <Moon size={18} color={activeColors.accent} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.refreshButton,
                { backgroundColor: activeColors.card, borderColor: activeColors.border },
              ]}
              onPress={refreshData}
              disabled={dataLoading}
              activeOpacity={0.7}
            >
              {dataLoading ? (
                <ActivityIndicator size="small" color={activeColors.accent} />
              ) : (
                <Activity size={18} color={activeColors.accent} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.content}>{renderActiveScreen()}</View>

      {/* Nav Tab selectors at base */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: activeColors.headerBg, borderTopColor: activeColors.border },
        ]}
      >
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveScreen('dashboard')}
          activeOpacity={0.7}
        >
          <LayoutDashboard
            size={20}
            color={activeScreen === 'dashboard' ? activeColors.accent : activeColors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              activeScreen === 'dashboard'
                ? { color: activeColors.accent, fontWeight: 'bold' }
                : { color: activeColors.textMuted },
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveScreen('projects')}
          activeOpacity={0.7}
        >
          <Building2
            size={20}
            color={
              ['projects', 'project-detail'].includes(activeScreen)
                ? activeColors.accent
                : activeColors.textMuted
            }
          />
          <Text
            style={[
              styles.tabText,
              ['projects', 'project-detail'].includes(activeScreen)
                ? { color: activeColors.accent, fontWeight: 'bold' }
                : { color: activeColors.textMuted },
            ]}
          >
            Projects
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveScreen('tasks')}
          activeOpacity={0.7}
        >
          <CheckSquare
            size={20}
            color={activeScreen === 'tasks' ? activeColors.accent : activeColors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              activeScreen === 'tasks'
                ? { color: activeColors.accent, fontWeight: 'bold' }
                : { color: activeColors.textMuted },
            ]}
          >
            Tasks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveScreen('finance')}
          activeOpacity={0.7}
        >
          <Wallet
            size={20}
            color={activeScreen === 'finance' ? activeColors.accent : activeColors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              activeScreen === 'finance'
                ? { color: activeColors.accent, fontWeight: 'bold' }
                : { color: activeColors.textMuted },
            ]}
          >
            Finance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveScreen('menu')}
          activeOpacity={0.7}
        >
          <Menu
            size={20}
            color={
              ['menu', 'daily-logs', 'materials', 'workers', 'reports', 'settings'].includes(
                activeScreen
              )
                ? activeColors.accent
                : activeColors.textMuted
            }
          />
          <Text
            style={[
              styles.tabText,
              ['menu', 'daily-logs', 'materials', 'workers', 'reports', 'settings'].includes(
                activeScreen
              )
                ? { color: activeColors.accent, fontWeight: 'bold' }
                : { color: activeColors.textMuted },
            ]}
          >
            Menu
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
