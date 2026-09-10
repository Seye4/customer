import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Booking, getBookingsByGroup } from '../../api/bookings';
import { getBookingStatusLabel } from '../../constants/bookingStatus';
import { useAuth } from '../../context/AuthContext';

export default function ActivityScreen() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [activeTab, token])
  );

  async function loadBookings(isRefresh = false) {
    if (!token) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await getBookingsByGroup(token, activeTab);
      setBookings(response.data.bookings);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function openBooking(booking: Booking) {
    router.push({
      pathname: '/booking/view',
      params: {
        bookingId: booking.id.toString(),
      },
    });
  }

  function getServiceDetails(service: string) {
    switch (service) {
      case 'ride':
        return { name: 'Ride', icon: '🚗' };
      case 'mechanic':
        return { name: 'Mechanic', icon: '🔧' };
      case 'tow':
        return { name: 'Tow Service', icon: '🛻' };
      default:
        return { name: service, icon: '⚡' };
    }
  }

  function getStatusStyles(status: string) {
    switch (status) {
      case 'completed':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#B91C1C' };
      default:
        return { bg: '#EFF6FF', text: '#1D4ED8' };
    }
  }

  function renderBooking({ item }: { item: Booking }) {
    const service = getServiceDetails(item.service_type);
    const statusStyle = getStatusStyles(item.status);
    const price = item.final_price ?? item.estimated_price;

    return (
      <Pressable
        onPress={() => openBooking(item)}
        style={({ pressed }) => [styles.card, pressed && styles.activeCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.serviceContainer}>
            <View style={styles.iconBadge}>
              <Text style={styles.iconText}>{service.icon}</Text>
            </View>
            <View>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.bookingNumber}>#{item.booking_number}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {getBookingStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        {item.vendor_name && (
          <View style={styles.vendorRow}>
            <Text style={styles.vendorLabel}>Provider</Text>
            <Text style={styles.vendorName}>{item.vendor_name}</Text>
          </View>
        )}

        {item.problem_description && (
          <Text numberOfLines={2} style={styles.problem}>
            {item.problem_description}
          </Text>
        )}

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>

          {price != null && <Text style={styles.price}>${Number(price).toFixed(2)}</Text>}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Activity</Text>
        <Text style={styles.subtitle}>Track and manage your service requests</Text>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <Pressable
            onPress={() => setActiveTab('upcoming')}
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              Upcoming
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('past')}
            style={[styles.tab, activeTab === 'past' && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>Past</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBooking}
          contentContainerStyle={bookings.length === 0 ? styles.emptyContainer : styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadBookings(true)}
              tintColor="#2563EB"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>🏎️</Text>
              </View>
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'upcoming'
                  ? 'You have no upcoming service requests.'
                  : 'You have no past activity records.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activeCard: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  bookingNumber: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  vendorLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  vendorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  problem: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  price: {
    fontWeight: '800',
    fontSize: 17,
    color: '#0F172A',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
});
