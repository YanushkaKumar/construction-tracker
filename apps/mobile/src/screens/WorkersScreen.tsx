import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { DropdownSelector } from '../components/common/DropdownSelector';
import { RegisterWorkerModal } from '../components/modals/RegisterWorkerModal';

export function WorkersScreen() {
  const {
    styles,
    activeColors,
    projects,
    workersTab,
    setWorkersTab,
    workersList,
    attendanceProjectId,
    setAttendanceProjectId,
    attendanceDate,
    setAttendanceDate,
    attendanceRecords,
    setAttendanceRecords,
    payrollStart,
    setPayrollStart,
    payrollEnd,
    setPayrollEnd,
    payrollSummary,
    handleSaveAttendance,
    isTablet,
    fmt,
  } = useAppContext();

  const [isRegisterWorkerOpen, setIsRegisterWorkerOpen] = useState(false);

  const handleAttendanceChange = (workerId: string, status: string, overtime?: number) => {
    setAttendanceRecords({
      ...attendanceRecords,
      [workerId]: {
        status: status || attendanceRecords[workerId]?.status || 'PRESENT',
        overtime: overtime !== undefined ? overtime : attendanceRecords[workerId]?.overtime || 0,
      },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Sub-tabs selectors */}
      <View
        style={[
          styles.subTabsContainer,
          { backgroundColor: activeColors.headerBg, borderBottomColor: activeColors.border },
        ]}
      >
        {['roster', 'attendance', 'payroll'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.subTabItem,
              workersTab === tab && { borderBottomColor: activeColors.accent },
            ]}
            onPress={() => setWorkersTab(tab as any)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.subTabText,
                workersTab === tab
                  ? { color: activeColors.accent, fontWeight: 'bold' }
                  : { color: activeColors.textMuted },
                { fontSize: 12, textTransform: 'capitalize' },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {workersTab === 'roster' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: activeColors.text }]}>
                Roster roster
              </Text>
              <TouchableOpacity
                style={[styles.premiumHeaderButton, { backgroundColor: activeColors.accent }]}
                onPress={() => setIsRegisterWorkerOpen(true)}
                activeOpacity={0.7}
              >
                <Plus size={12} color={activeColors.textDark} />
                <Text style={[styles.premiumHeaderBtnText, { color: activeColors.textDark }]}>
                  Register Worker
                </Text>
              </TouchableOpacity>
            </View>

            <View style={isTablet ? styles.tabletGridContainer : null}>
              {workersList.map((w) => (
                <View
                  key={w.id}
                  style={
                    isTablet
                      ? [
                          styles.memberCard,
                          styles.tabletGridCard,
                          { backgroundColor: activeColors.card, borderColor: activeColors.border },
                        ]
                      : [
                          styles.memberCard,
                          { backgroundColor: activeColors.card, borderColor: activeColors.border },
                        ]
                  }
                >
                  <View style={styles.memberInfoCol}>
                    <Text style={[styles.memberName, { color: activeColors.text }]}>
                      {w.firstName} {w.lastName}
                    </Text>
                    <Text style={{ color: activeColors.textMuted, fontSize: 11, marginTop: 2 }}>
                      NIC: {w.nic} • Skill: {w.skillType}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: activeColors.accent, fontWeight: 'bold', fontSize: 14 }}>
                      {fmt(w.dailyRate)}
                    </Text>
                    <Text style={{ color: activeColors.textMuted, fontSize: 9 }}>/ Day</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {workersTab === 'attendance' && (
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 12, color: activeColors.text }]}>
              Config details
            </Text>
            <DropdownSelector
              label="Target Project"
              value={attendanceProjectId}
              options={projects.map((p) => ({ label: p.code, value: p.id }))}
              onSelect={setAttendanceProjectId}
            />

            <Text style={[styles.formLabel, { color: activeColors.textMuted }]}>
              Date Selection
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: activeColors.inputBg,
                  borderColor: activeColors.inputBorder,
                  color: activeColors.text,
                },
              ]}
              value={attendanceDate}
              onChangeText={setAttendanceDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#71717a"
            />

            <Text
              style={[
                styles.sectionTitle,
                { marginTop: 16, marginBottom: 12, color: activeColors.text },
              ]}
            >
              Mark Attendance checklist
            </Text>
            {workersList.map((w) => {
              const record = attendanceRecords[w.id] || { status: 'ABSENT', overtime: 0 };
              return (
                <View
                  key={w.id}
                  style={[
                    styles.premiumCardItem,
                    { backgroundColor: activeColors.card, borderColor: activeColors.border },
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={[styles.taskTitleText, { color: activeColors.text }]}>
                        {w.firstName} {w.lastName}
                      </Text>
                      <Text style={{ color: activeColors.textMuted, fontSize: 10, marginTop: 2 }}>
                        {w.skillType}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {['PRESENT', 'HALF_DAY', 'ABSENT'].map((st) => (
                        <TouchableOpacity
                          key={st}
                          onPress={() => handleAttendanceChange(w.id, st)}
                          style={[
                            styles.attendanceStatusBtn,
                            record.status === st && {
                              backgroundColor:
                                st === 'PRESENT'
                                  ? '#10b981'
                                  : st === 'HALF_DAY'
                                  ? '#f59e0b'
                                  : '#f43f5e',
                              borderColor: 'transparent',
                            },
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.attendanceStatusBtnText,
                              record.status === st && { color: '#fff' },
                            ]}
                          >
                            {st.replace('_', ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {record.status !== 'ABSENT' && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 10,
                        borderTopWidth: 1,
                        borderTopColor: activeColors.border,
                        paddingTop: 10,
                      }}
                    >
                      <Text style={{ color: activeColors.textMuted, fontSize: 12, flex: 1 }}>
                        Overtime (OT Hours)
                      </Text>
                      <TextInput
                        style={[
                          styles.modalInput,
                          {
                            backgroundColor: activeColors.inputBg,
                            borderColor: activeColors.inputBorder,
                            color: activeColors.text,
                            marginBottom: 0,
                            width: 80,
                            height: 32,
                            textAlign: 'center',
                          },
                        ]}
                        value={record.overtime.toString()}
                        keyboardType="numeric"
                        onChangeText={(val) =>
                          handleAttendanceChange(w.id, record.status, Number(val) || 0)
                        }
                      />
                    </View>
                  )}
                </View>
              );
            })}

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: activeColors.accent }]}
              onPress={handleSaveAttendance}
              activeOpacity={0.7}
            >
              <Text style={[styles.submitBtnText, { color: activeColors.textDark }]}>
                Save Attendance registers
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {workersTab === 'payroll' && (
          <View>
            <Text style={[styles.sectionTitle, { color: activeColors.text }]}>
              Date boundaries selection
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: activeColors.textMuted, fontSize: 10, marginBottom: 4 }}>
                  Start Date
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: activeColors.inputBg,
                      borderColor: activeColors.inputBorder,
                      color: activeColors.text,
                    },
                  ]}
                  value={payrollStart}
                  onChangeText={setPayrollStart}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#71717a"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: activeColors.textMuted, fontSize: 10, marginBottom: 4 }}>
                  End Date
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: activeColors.inputBg,
                      borderColor: activeColors.inputBorder,
                      color: activeColors.text,
                    },
                  ]}
                  value={payrollEnd}
                  onChangeText={setPayrollEnd}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#71717a"
                />
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginBottom: 12, color: activeColors.text }]}>
              Calculated payouts
            </Text>
            {payrollSummary.map((p, idx) => (
              <View
                key={idx}
                style={[
                  styles.premiumCardItem,
                  { backgroundColor: activeColors.card, borderColor: activeColors.border },
                ]}
              >
                <View style={styles.projectHeaderRow}>
                  <Text style={[styles.taskTitleText, { color: activeColors.text }]}>
                    {p.firstName} {p.lastName}
                  </Text>
                  <Text style={[styles.premiumEarningsEstimate, { color: activeColors.accent }]}>
                    {fmt(p.totalEarnings)}
                  </Text>
                </View>
                <Text style={[styles.taskDescText, { color: activeColors.textMuted }]}>
                  Skill: {p.skillType} • Present: {p.daysPresent} days • OT:{' '}
                  {p.totalOvertimeHours} hours
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <RegisterWorkerModal
        visible={isRegisterWorkerOpen}
        onClose={() => setIsRegisterWorkerOpen(false)}
      />
    </View>
  );
}
