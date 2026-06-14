import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

function SkeletonBox({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#E0E0E0',
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

export function GuideSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <View style={styles.headerText}>
          <SkeletonBox width={120} height={14} />
          <SkeletonBox width={80} height={12} style={{ marginTop: 6 }} />
        </View>
      </View>

      <SkeletonBox width="60%" height={24} style={{ marginBottom: 16 }} />
      <SkeletonBox width="100%" height={70} style={{ marginBottom: 8 }} />
      <SkeletonBox width="100%" height={70} style={{ marginBottom: 8 }} />
      <SkeletonBox width="100%" height={70} style={{ marginBottom: 20 }} />

      <SkeletonBox width="50%" height={24} style={{ marginBottom: 16 }} />
      <SkeletonBox width="100%" height={60} style={{ marginBottom: 8 }} />
      <SkeletonBox width="100%" height={60} style={{ marginBottom: 20 }} />

      <SkeletonBox width="40%" height={24} style={{ marginBottom: 16 }} />
      <View style={styles.grid}>
        <SkeletonBox width="47%" height={60} />
        <SkeletonBox width="47%" height={60} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});
