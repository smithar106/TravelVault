import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CountdownDisplayProps {
  targetDate: string;
  label?: string;
}

export function CountdownDisplay({ targetDate, label }: CountdownDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000 * 60); // Update every minute

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label || 'Trip is here!'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {timeLeft.days > 0 && (
          <View style={styles.unit}>
            <Text style={styles.number}>{timeLeft.days}</Text>
            <Text style={styles.unitLabel}>days</Text>
          </View>
        )}
        <View style={styles.unit}>
          <Text style={styles.number}>{timeLeft.hours}</Text>
          <Text style={styles.unitLabel}>hrs</Text>
        </View>
        <View style={styles.unit}>
          <Text style={styles.number}>{timeLeft.minutes}</Text>
          <Text style={styles.unitLabel}>min</Text>
        </View>
      </View>
    </View>
  );
}

function calculateTimeLeft(targetDate: string) {
  const difference = new Date(targetDate).getTime() - Date.now();
  if (difference <= 0) return null;

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
  };
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  unit: {
    alignItems: 'center',
  },
  number: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222',
  },
  unitLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
