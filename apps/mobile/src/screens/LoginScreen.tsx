import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Building2, Server, Mail, Lock, User } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

export function LoginScreen() {
  const {
    styles,
    activeColors,
    theme,
    isTablet,
    apiHost,
    setApiHost,
    email,
    setEmail,
    password,
    setPassword,
    authLoading,
    handleLogin,
  } = useAppContext();

  return (
    <View style={[styles.loginContainer, { backgroundColor: activeColors.background }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={activeColors.background}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.loginScrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.loginCard,
              {
                width: isTablet ? 450 : '100%',
                alignSelf: 'center',
                backgroundColor: activeColors.card,
                borderColor: activeColors.border,
                padding: 18,
              },
            ]}
          >
            <View style={[styles.brandContainer, { marginBottom: 12 }]}>
              <View
                style={[
                  styles.brandLogo,
                  {
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: activeColors.accent,
                    marginBottom: 8,
                  },
                ]}
              >
                <Building2 size={24} color={activeColors.textDark} />
              </View>
              <Text style={[styles.brandTitle, { color: activeColors.text, fontSize: 22 }]}>
                Build<Text style={[styles.brandAccent, { color: activeColors.accent }]}>Track</Text>
              </Text>
              <Text style={[styles.brandSub, { color: activeColors.textMuted, marginTop: 2 }]}>
                Construction Command Center
              </Text>
            </View>

            <Text
              style={[
                styles.sectionTitle,
                { fontSize: 16, marginBottom: 2, textAlign: 'center', color: activeColors.text },
              ]}
            >
              Welcome Back
            </Text>
            <Text
              style={{
                color: activeColors.textMuted,
                fontSize: 11,
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              Enter credentials to access your construction command dashboard
            </Text>

            <View style={[styles.inputGroup, { marginBottom: 10 }]}>
              <Text style={[styles.inputLabel, { color: activeColors.textMuted }]}>
                API Gateway Host
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: activeColors.inputBg,
                    borderColor: activeColors.inputBorder,
                    height: 42,
                  },
                ]}
              >
                <Server size={14} color={activeColors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: activeColors.text, fontSize: 13 }]}
                  placeholder="e.g. http://192.168.1.166:4000/api/v1"
                  placeholderTextColor={activeColors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={apiHost}
                  onChangeText={setApiHost}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { marginBottom: 10 }]}>
              <Text style={[styles.inputLabel, { color: activeColors.textMuted }]}>
                Email Address
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: activeColors.inputBg,
                    borderColor: activeColors.inputBorder,
                    height: 42,
                  },
                ]}
              >
                <Mail size={14} color={activeColors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: activeColors.text, fontSize: 13 }]}
                  placeholder="name@company.com"
                  placeholderTextColor={activeColors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { marginBottom: 12 }]}>
              <Text style={[styles.inputLabel, { color: activeColors.textMuted }]}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: activeColors.inputBg,
                    borderColor: activeColors.inputBorder,
                    height: 42,
                  },
                ]}
              >
                <Lock size={14} color={activeColors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: activeColors.text, fontSize: 13 }]}
                  placeholder="••••••••"
                  placeholderTextColor={activeColors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                { backgroundColor: activeColors.accent, height: 44, marginTop: 4 },
              ]}
              onPress={handleLogin}
              disabled={authLoading}
              activeOpacity={0.7}
            >
              {authLoading ? (
                <ActivityIndicator size="small" color={activeColors.textDark} />
              ) : (
                <Text style={[styles.loginButtonText, { color: activeColors.textDark, fontSize: 14 }]}>
                  Log In to Dashboard
                </Text>
              )}
            </TouchableOpacity>

            {/* Demo Accounts quick autofill */}
            <View
              style={{
                marginTop: 16,
                borderTopWidth: 1,
                borderTopColor: activeColors.border,
                paddingTop: 12,
              }}
            >
              <Text
                style={{
                  color: activeColors.textMuted,
                  fontSize: 9,
                  fontWeight: '800',
                  textAlign: 'center',
                  marginBottom: 8,
                  letterSpacing: 0.5,
                }}
              >
                DEMO ACCOUNTS QUICK-FILL
              </Text>
              <View style={{ gap: 6 }}>
                <TouchableOpacity
                  style={[
                    styles.demoFillBtn,
                    {
                      backgroundColor: activeColors.inputBg,
                      borderColor: activeColors.inputBorder,
                      height: 36,
                      marginTop: 0,
                    },
                  ]}
                  onPress={() => {
                    setEmail('owner@lankabuild.lk');
                    setPassword('BuildTrack@2026');
                  }}
                  activeOpacity={0.7}
                >
                  <User size={12} color={activeColors.accent} />
                  <Text style={[styles.demoFillBtnText, { color: activeColors.text, fontSize: 11 }]}>
                    Owner:{' '}
                    <Text style={{ fontWeight: 'normal', color: activeColors.textMuted }}>
                      owner@lankabuild.lk
                    </Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.demoFillBtn,
                    {
                      backgroundColor: activeColors.inputBg,
                      borderColor: activeColors.inputBorder,
                      height: 36,
                      marginTop: 0,
                    },
                  ]}
                  onPress={() => {
                    setEmail('pm@lankabuild.lk');
                    setPassword('BuildTrack@2026');
                  }}
                  activeOpacity={0.7}
                >
                  <User size={12} color={activeColors.accent} />
                  <Text style={[styles.demoFillBtnText, { color: activeColors.text, fontSize: 11 }]}>
                    Manager:{' '}
                    <Text style={{ fontWeight: 'normal', color: activeColors.textMuted }}>
                      pm@lankabuild.lk
                    </Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.demoFillBtn,
                    {
                      backgroundColor: activeColors.inputBg,
                      borderColor: activeColors.inputBorder,
                      height: 36,
                      marginTop: 0,
                    },
                  ]}
                  onPress={() => {
                    setEmail('engineer@lankabuild.lk');
                    setPassword('BuildTrack@2026');
                  }}
                  activeOpacity={0.7}
                >
                  <User size={12} color={activeColors.accent} />
                  <Text style={[styles.demoFillBtnText, { color: activeColors.text, fontSize: 11 }]}>
                    Engineer:{' '}
                    <Text style={{ fontWeight: 'normal', color: activeColors.textMuted }}>
                      engineer@lankabuild.lk
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
