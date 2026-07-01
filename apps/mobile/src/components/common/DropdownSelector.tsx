import React, { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';

export interface DropdownSelectorProps {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onSelect: (val: string) => void;
  placeholder?: string;
  style?: any;
}

export function DropdownSelector({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select...',
  style,
}: DropdownSelectorProps) {
  const [open, setOpen] = useState(false);
  const { styles, activeColors } = useAppContext();
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={[{ marginBottom: 12 }, style]}>
      <TouchableOpacity
        style={styles.dropdownTrigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dropdownTriggerText,
            { color: value ? activeColors.text : activeColors.textMuted },
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={{ color: activeColors.textMuted, fontSize: 11 }}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dropdownModalContent}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} activeOpacity={0.7}>
                <X size={20} color={activeColors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 12 }}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.dropdownItem,
                    value === opt.value && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    onSelect(opt.value);
                    setOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      value === opt.value && styles.dropdownItemTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
