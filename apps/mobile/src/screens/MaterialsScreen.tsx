import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { DropdownSelector } from '../components/common/DropdownSelector';
import { MaterialRequestModal } from '../components/modals/MaterialRequestModal';

export function MaterialsScreen() {
  const {
    styles,
    activeColors,
    projects,
    materialsTab,
    setMaterialsTab,
    materialRequests,
    materialsCatalog,
    suppliers,
    materialsFilterProjectId,
    setMaterialsFilterProjectId,
    handleUpdateMaterialRequestStatus,
    isTablet,
    fmt,
  } = useAppContext();

  const [isMaterialRequestModalOpen, setIsMaterialRequestModalOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={[
          styles.filterBarContainer,
          { backgroundColor: activeColors.headerBg, borderBottomColor: activeColors.border },
        ]}
      >
        <DropdownSelector
          label="Select Project"
          value={materialsFilterProjectId}
          options={projects.map((p) => ({ label: `${p.code} — ${p.name}`, value: p.id }))}
          onSelect={setMaterialsFilterProjectId}
          placeholder="Choose Site..."
          style={{ marginBottom: 0 }}
        />
      </View>

      {/* Sub-tabs selectors */}
      <View
        style={[
          styles.subTabsContainer,
          { backgroundColor: activeColors.headerBg, borderBottomColor: activeColors.border },
        ]}
      >
        {['requests', 'inventory', 'suppliers'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.subTabItem,
              materialsTab === tab && { borderBottomColor: activeColors.accent },
            ]}
            onPress={() => setMaterialsTab(tab as any)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.subTabText,
                materialsTab === tab
                  ? { color: activeColors.accent, fontWeight: 'bold' }
                  : { color: activeColors.textMuted },
                { fontSize: 12, textTransform: 'capitalize' },
              ]}
            >
              {tab === 'requests' ? 'Requisitions' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {materialsTab === 'requests' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: activeColors.text }]}>
                Procurement requests
              </Text>
              <TouchableOpacity
                style={[styles.premiumHeaderButton, { backgroundColor: activeColors.accent }]}
                onPress={() => setIsMaterialRequestModalOpen(true)}
                activeOpacity={0.7}
              >
                <Plus size={12} color={activeColors.textDark} />
                <Text style={[styles.premiumHeaderBtnText, { color: activeColors.textDark }]}>
                  Request Materials
                </Text>
              </TouchableOpacity>
            </View>

            {materialRequests.map((req) => (
              <View
                key={req.id}
                style={[
                  styles.premiumCardItem,
                  { backgroundColor: activeColors.card, borderColor: activeColors.border },
                ]}
              >
                <View style={styles.projectHeaderRow}>
                  <Text style={[styles.taskTitleText, { color: activeColors.text }]}>
                    {req.material?.name}
                  </Text>
                  <Text style={[styles.premiumEarningsEstimate, { color: activeColors.accent }]}>
                    {fmt(req.totalPrice || 0)}
                  </Text>
                </View>
                <Text style={[styles.taskDescText, { color: activeColors.textMuted }]}>
                  Quantity: {req.quantity} {req.material?.unit} • Supplier:{' '}
                  {req.supplier?.name || 'N/A'}
                </Text>

                <View
                  style={[styles.taskCardActionRow, { borderTopColor: activeColors.borderMuted }]}
                >
                  <Text style={[styles.taskAssigneeText, { color: activeColors.textMuted }]}>
                    Status:{' '}
                    <Text style={{ color: activeColors.accent, fontWeight: 'bold' }}>
                      {req.status}
                    </Text>
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {['DELIVERED', 'CANCELLED'].includes(req.status) ? null : (
                      <>
                        <TouchableOpacity
                          onPress={() => handleUpdateMaterialRequestStatus(req.id, 'APPROVED')}
                          style={styles.miniActionApproveBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: '#10b981', fontSize: 10, fontWeight: 'bold' }}>
                            Approve
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleUpdateMaterialRequestStatus(req.id, 'DELIVERED')}
                          style={styles.miniActionDeliverBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: '#60a5fa', fontSize: 10, fontWeight: 'bold' }}>
                            Deliver
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </View>
            ))}
            {materialRequests.length === 0 && (
              <Text style={[styles.emptyPlaceholderText, { color: activeColors.textMuted }]}>
                No requisitions logs found
              </Text>
            )}
          </View>
        )}

        {materialsTab === 'inventory' && (
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 12, color: activeColors.text }]}>
              Material Inventories
            </Text>
            <View style={isTablet ? styles.tabletGridContainer : null}>
              {materialsCatalog.map((m) => {
                const isLow = m.currentStock <= m.minimumStock;
                return (
                  <View
                    key={m.id}
                    style={
                      isTablet
                        ? [
                            styles.premiumCardItem,
                            styles.tabletGridCard,
                            {
                              backgroundColor: activeColors.card,
                              borderColor: isLow ? activeColors.accent : activeColors.border,
                            },
                          ]
                        : [
                            styles.premiumCardItem,
                            {
                              backgroundColor: activeColors.card,
                              borderColor: isLow ? activeColors.accent : activeColors.border,
                            },
                          ]
                    }
                  >
                    <View style={styles.projectHeaderRow}>
                      <Text style={[styles.taskTitleText, { color: activeColors.text }]}>
                        {m.name}
                      </Text>
                      {isLow && (
                        <View style={styles.stockAlertLabelContainer}>
                          <Text style={styles.stockAlertLabelText}>LOW STOCK</Text>
                        </View>
                      )}
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 10,
                        borderTopWidth: 1,
                        borderTopColor: activeColors.border,
                        paddingTop: 10,
                      }}
                    >
                      <Text style={[styles.cardMetaLabel, { color: activeColors.textMuted }]}>
                        Stock:{' '}
                        <Text style={{ color: activeColors.text, fontWeight: 'bold' }}>
                          {m.currentStock} {m.unit}
                        </Text>
                      </Text>
                      <Text style={[styles.cardMetaLabel, { color: activeColors.textMuted }]}>
                        Unit price:{' '}
                        <Text style={{ color: activeColors.text, fontWeight: 'bold' }}>
                          LKR {m.unitPrice.toLocaleString()}
                        </Text>
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {materialsTab === 'suppliers' && (
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 12, color: activeColors.text }]}>
              Suppliers directory
            </Text>
            <View style={isTablet ? styles.tabletGridContainer : null}>
              {suppliers.map((s) => (
                <View
                  key={s.id}
                  style={
                    isTablet
                      ? [
                          styles.premiumCardItem,
                          styles.tabletGridCard,
                          { backgroundColor: activeColors.card, borderColor: activeColors.border },
                        ]
                      : [
                          styles.premiumCardItem,
                          { backgroundColor: activeColors.card, borderColor: activeColors.border },
                        ]
                  }
                >
                  <View style={styles.projectHeaderRow}>
                    <Text style={[styles.taskTitleText, { color: activeColors.text }]}>
                      {s.name}
                    </Text>
                    <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: 'bold' }}>
                      ★ {s.rating || 5}.0
                    </Text>
                  </View>
                  <Text style={[styles.taskDescText, { color: activeColors.textMuted }]}>
                    Contact: {s.contactPerson || 'N/A'} • Phone: {s.phone || 'N/A'}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
                    {s.materialTypes.map((t, i) => (
                      <View
                        key={i}
                        style={[
                          styles.capsuleBadge,
                          {
                            backgroundColor: activeColors.background,
                            borderColor: activeColors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.capsuleBadgeText, { color: activeColors.text }]}>
                          {t}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <MaterialRequestModal
        visible={isMaterialRequestModalOpen}
        onClose={() => setIsMaterialRequestModalOpen(false)}
      />
    </View>
  );
}
