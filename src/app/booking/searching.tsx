import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { cancelBooking, findVendors } from '../../api/bookings';

type SearchingParams = {
  bookingId?: string;
};

const SEARCH_STAGES = [
  'Broadcasting job request...',
  'Locating nearby available vendors...',
  'Calculating route & estimated ETA...',
  'Waiting for vendor acceptance...',
];

// Timeout duration in seconds (2 minutes)
const MAX_SEARCH_DURATION_SECONDS = 120;

export default function SearchingScreen(): React.JSX.Element {
  const { bookingId } = useLocalSearchParams<SearchingParams>();
  const { token } = useAuth();

  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [vendorCount, setVendorCount] = useState<number>(0);
  const [searchStopped, setSearchStopped] = useState<boolean>(false);

  // Animated pulse values
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  /*
   * 1. RADAR ANIMATION LOOP
   */
  useEffect(() => {
    if (searchStopped) return;

    const createPulseAnimation = (animatedValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 2500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createPulseAnimation(pulse1, 0);
    const anim2 = createPulseAnimation(pulse2, 1250);

    anim1.start();
    anim2.start();

    return () => {
      anim1.stop();
      anim2.stop();
    };
  }, [pulse1, pulse2, searchStopped]);

  /*
   * 2. TIMERS, STAGE UPDATES & TIMEOUT HANDLING
   */
  useEffect(() => {
    if (searchStopped) return;

    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [searchStopped]);

  useEffect(() => {
    if (secondsElapsed > 0 && secondsElapsed % 4 === 0 && !searchStopped) {
      setStageIndex((prev) => (prev + 1) % SEARCH_STAGES.length);
    }
  }, [secondsElapsed, searchStopped]);

  /*
   * 3. TIMEOUT HANDLER
   */
  const handleSearchTimeout = useCallback(async (): Promise<void> => {
    setSearchStopped(true);

    if (bookingId && token) {
      try {
        if (cancelBooking) {
          await cancelBooking(token, Number(bookingId), 'Search timed out - no vendors available.');
        }
      } catch (error) {
        console.error('[SearchingScreen] Error auto-cancelling booking on timeout:', error);
      }
    }

    Alert.alert(
      'No Providers Available',
      'We could not find an available service provider in your area right now. Please try requesting again later.',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ],
      { cancelable: false }
    );
  }, [bookingId, token]);

  useEffect(() => {
    if (secondsElapsed >= MAX_SEARCH_DURATION_SECONDS && !searchStopped) {
      void handleSearchTimeout();
    }
  }, [secondsElapsed, searchStopped, handleSearchTimeout]);

  /*
   * 4. DISPATCH VENDORS & CHECK STATUS POLLING
   */
  useEffect(() => {
    if (!bookingId || !token || searchStopped) return;

    const numericBookingId = Number(bookingId);
    if (!Number.isSafeInteger(numericBookingId) || numericBookingId <= 0) {
      setSearchStopped(true);
      Alert.alert('Invalid booking', 'Please create a new booking.');
      return;
    }
    let disposed = false;
    let inFlight = false;

    const triggerVendorSearch = async () => {
      if (inFlight || disposed) return;
      inFlight = true;
      try {
        console.log(`[SearchingScreen] Triggering findVendors for Booking #${numericBookingId}...`);
        const response = await findVendors(numericBookingId, token);

        if (!disposed && response?.success && typeof response.vendors_found === 'number') {
          setVendorCount((count) => count + response.vendors_found);
        }
      } catch (error) {
        console.error('[SearchingScreen] Error triggering findVendors:', error);
      } finally {
        inFlight = false;
      }
    };

    triggerVendorSearch();
    const searchInterval = setInterval(triggerVendorSearch, 10000);

    return () => {
      disposed = true;
      clearInterval(searchInterval);
    };
  }, [bookingId, token, searchStopped]);

  /*
   * 5. CANCEL ACTION HANDLER
   */
  const handleCancelBooking = (): void => {
    Alert.alert('Cancel Request?', 'Are you sure you want to cancel search for vendors?', [
      { text: 'Keep Searching', style: 'cancel' },
      {
        text: 'Cancel Request',
        style: 'destructive',
        onPress: async () => {
          if (!bookingId || !token) {
            router.back();
            return;
          }

          try {
            setCancelling(true);
            setSearchStopped(true);

            if (cancelBooking) {
              await cancelBooking(token, Number(bookingId));
            }
            router.back();
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to cancel booking.');
            setCancelling(false);
            setSearchStopped(false);
          }
        },
      },
    ]);
  };

  /*
   * 6. ANIMATION INTERPOLATION STYLES
   */
  const getPulseStyle = (animatedValue: Animated.Value) => ({
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 2.4],
        }),
      },
    ],
    opacity: animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 0.3, 0],
    }),
  });

  return (
    <View style={styles.container}>
      {/* HEADER INFO */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {searchStopped ? 'Search Stopped' : 'Finding Your Service Provider'}
        </Text>
        <Text style={styles.bookingNumber}>
          {bookingId ? `Booking #${bookingId}` : 'Dispatching request...'}
        </Text>
      </View>

      {/* RADAR ANIMATION CENTER */}
      <View style={styles.radarContainer}>
        {!searchStopped && (
          <>
            <Animated.View style={[styles.pulseCircle, getPulseStyle(pulse1)]} />
            <Animated.View style={[styles.pulseCircle, getPulseStyle(pulse2)]} />
          </>
        )}

        <View style={styles.centerBadge}>
          <Text style={styles.radarIcon}>{searchStopped ? '⚠️' : '🔍'}</Text>
        </View>
      </View>

      {/* STATUS & PROGRESS */}
      <View style={styles.statusBox}>
        <Text style={styles.stageText}>
          {searchStopped ? 'No response received' : SEARCH_STAGES[stageIndex]}
        </Text>
        {vendorCount > 0 && !searchStopped && (
          <Text style={styles.vendorNotice}>
            Notified {vendorCount} nearby provider{vendorCount > 1 ? 's' : ''}...
          </Text>
        )}
        <Text style={styles.timerText}>
          Time elapsed: {Math.floor(secondsElapsed / 60)}:
          {(secondsElapsed % 60).toString().padStart(2, '0')}
        </Text>
      </View>

      {/* FOOTER ACTIONS */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cancelButton, (cancelling || searchStopped) && styles.disabled]}
          disabled={cancelling || searchStopped}
          onPress={handleCancelBooking}
          activeOpacity={0.8}>
          <Text style={styles.cancelText}>{cancelling ? 'Cancelling...' : 'Cancel Request'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bookingNumber: {
    marginTop: 8,
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  radarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 200,
    height: 200,
  },
  pulseCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#2563EB',
  },
  centerBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  radarIcon: {
    fontSize: 36,
  },
  statusBox: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stageText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38BDF8',
    textAlign: 'center',
    minHeight: 24,
  },
  vendorNotice: {
    marginTop: 6,
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  timerText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  footer: {
    width: '100%',
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#F87171',
    fontSize: 15,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
