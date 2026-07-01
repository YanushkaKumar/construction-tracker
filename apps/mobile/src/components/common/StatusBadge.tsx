import React from 'react';
import { View, Text } from 'react-native';

export const getPriorityColor = (p: string) => {
  switch (p) {
    case 'URGENT':
      return { bg: 'rgba(244,63,94,0.1)', text: '#f43f5e' };
    case 'HIGH':
      return { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' };
    case 'MEDIUM':
      return { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' };
    default:
      return { bg: 'rgba(161,161,170,0.1)', text: '#a1a1aa' };
  }
};

export const getStatusBadgeColors = (s: string) => {
  switch (s) {
    case 'COMPLETED':
    case 'DELIVERED':
    case 'APPROVED':
      return { bg: 'rgba(16,185,129,0.1)', text: '#10b981' };
    case 'IN_PROGRESS':
    case 'ORDERED':
    case 'PENDING':
      return { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' };
    case 'IN_REVIEW':
      return { bg: 'rgba(99,102,241,0.1)', text: '#6366f1' };
    case 'BLOCKED':
    case 'CANCELLED':
    case 'REJECTED':
      return { bg: 'rgba(244,63,94,0.1)', text: '#f43f5e' };
    default:
      return { bg: 'rgba(63,63,70,0.15)', text: '#d4d4d8' };
  }
};

interface StatusBadgeProps {
  type: 'priority' | 'status';
  value: string;
  style?: any;
}

export function StatusBadge({ type, value, style }: StatusBadgeProps) {
  const colors = type === 'priority' ? getPriorityColor(value) : getStatusBadgeColors(value);
  return (
    <View
      style={[
        {
          backgroundColor: colors.bg,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 10,
          fontWeight: 'bold',
          textTransform: 'uppercase',
        }}
      >
        {value.replace('_', ' ')}
      </Text>
    </View>
  );
}
