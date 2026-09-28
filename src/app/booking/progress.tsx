import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '@/context/AuthContext';
import { BookingProgressData, getProgress, getTracking, TrackingData } from '@/api/tracking';
import { Conversation, getConversationForBooking, getConversations } from '@/services/chat';

export default function ProgressScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { token } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [progress, setProgress] = useState<BookingProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    loadConversation();
  }, [bookingId]);

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 5000);

    return () => clearInterval(interval);
  }, [token, bookingId]);

  async function loadData() {
    if (!token || !bookingId) return;

    try {
      const [trackingRes, progressRes] = await Promise.all([
        getTracking(token, Number(bookingId)),
        getProgress(token, Number(bookingId)),
      ]);

      const trackingData = trackingRes?.data?.tracking || null;
      const progressData = progressRes?.data || null;

      setTracking(trackingData);
      setProgress(progressData);

      // Check for completion status and redirect
      const latestStatus = progressData?.booking?.status || trackingData?.status || '';

      if (latestStatus === 'completed') {
        router.replace({
          pathname: './complete', // Adjust pathname to match your complete screen route
          params: { bookingId },
        });
        return;
      }
    } catch (error) {
      console.error('Error fetching tracking/progress data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!tracking && !progress) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Tracking unavailable.</Text>
      </View>
    );
  }

  /* async function loadConversation() {
    if (!bookingId) {
      return;
    }

    try {
      setChatLoading(true);

      const response = await getConversations();

      if (!response.success) {
        throw new Error(response.message || 'Unable to load conversations.');
      }

      const matchingConversation = response.conversations?.find(
        (item) => Number(item.booking_id) === Number(bookingId)
      );

      setConversation(matchingConversation || null);
    } catch (error) {
      console.error('[Chat] Failed to load conversation:', error);
      setConversation(null);
    } finally {
      setChatLoading(false);
    }
  } */

  async function loadConversation() {
    if (!bookingId) return;

    try {
      setChatLoading(true);

      const result = await getConversationForBooking(bookingId);

      setConversation(result);
    } catch (error) {
      console.error('[Chat] Failed to load conversation:', error);
      setConversation(null);
    } finally {
      setChatLoading(false);
    }
  }

  function openChat() {
    if (chatLoading) {
      return;
    }

    if (!conversation) {
      // The conversation might not exist yet.
      Alert.alert('Chat Unavailable', 'There is no active conversation for this booking yet.');

      return;
    }

    router.push({
      pathname: './chat',
      params: {
        conversationId: String(conversation.id),
        providerName: conversation.other_user_name || vendorName || 'Service Provider',
        serviceType: 'Service',
        bookingNumber: progress?.booking?.booking_number || bookingId,
        /* serviceType: conversation.service_type || '',
        bookingNumber:
          conversation.booking_number || progress?.booking?.booking_number || bookingId, */
      },
    });
  }

  const currentStatus = progress?.booking?.status || tracking?.status || '';
  const vendorName =
    progress?.booking?.business_name || tracking?.business_name || 'Service Provider';

  const vendorLatitude = Number(tracking?.last_latitude ?? tracking?.last_latitude);
  const vendorLongitude = Number(tracking?.last_longitude ?? tracking?.last_longitude);
  const pickupLatitude = Number(tracking?.pickup_latitude);
  const pickupLongitude = Number(tracking?.pickup_longitude);

  const hasVendorLocation = Number.isFinite(vendorLatitude) && Number.isFinite(vendorLongitude);

  const initialLatitude = hasVendorLocation ? vendorLatitude : pickupLatitude;
  const initialLongitude = hasVendorLocation ? vendorLongitude : pickupLongitude;

  return (
    <View style={styles.container}>
      {/* MAP VIEW */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: Number.isFinite(initialLatitude) ? initialLatitude : 0,
          longitude: Number.isFinite(initialLongitude) ? initialLongitude : 0,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}>
        {hasVendorLocation && (
          <Marker
            coordinate={{
              latitude: vendorLatitude,
              longitude: vendorLongitude,
            }}
            title={vendorName}
            description="Service Provider">
            <View style={styles.driverMarker}>
              <Text style={styles.markerEmoji}>🚗</Text>
            </View>
          </Marker>
        )}

        {Number.isFinite(pickupLatitude) && Number.isFinite(pickupLongitude) && (
          <Marker
            coordinate={{
              latitude: pickupLatitude,
              longitude: pickupLongitude,
            }}
            title="Pickup Location">
            <View style={styles.pickupMarker}>
              <View style={styles.innerDot} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* FLOATING GLASS CARD */}
      <View style={styles.card}>
        <View style={styles.handleBar} />

        {/* HEADER & STATUS BADGE */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.statusTitle}>{formatStatus(currentStatus)}</Text>
            {progress?.booking?.booking_number && (
              <Text style={styles.bookingNumber}>#{progress.booking.booking_number}</Text>
            )}
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{currentStatus.replace('_', ' ')}</Text>
          </View>
        </View>

        {/* VENDOR INFORMATION */}
        {vendorName && (
          <View style={styles.vendorContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{vendorName.charAt(0)}</Text>
            </View>
            <View style={styles.vendorDetails}>
              <Text style={styles.vendorName}>{vendorName}</Text>
              {progress?.booking?.rating && (
                <Text style={styles.vendorRating}>
                  ⭐ {Number(progress.booking.rating).toFixed(1)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ACTIONS */}
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.chatButton, !conversation && styles.chatButtonDisabled]}
            onPress={openChat}
            disabled={chatLoading}>
            {chatLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.chatButtonText}>💬 Chat</Text>
            )}
          </Pressable>

          <Pressable style={styles.toggleButton} onPress={() => setShowTimeline(!showTimeline)}>
            <Text style={styles.toggleButtonText}>
              {showTimeline ? 'Hide History ▲' : 'Timeline ▼'}
            </Text>
          </Pressable>
        </View>

        {/* EXPANDABLE TIMELINE */}
        {showTimeline && progress?.events && progress.events.length > 0 && (
          <View style={styles.timelineSection}>
            <Text style={styles.timelineTitle}>Activity History</Text>
            <FlatList
              data={progress.events}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item, index }) => {
                const isLast = index === progress.events.length - 1;
                return (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineLineContainer}>
                      <View style={[styles.timelineDot, isLast && styles.timelineDotActive]} />
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.eventDescription}>{item.description}</Text>
                      <Text style={styles.eventTime}>{formatTime(item.created_at)}</Text>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function formatStatus(status: string) {
  switch (status) {
    case 'searching':
      return 'Finding a provider';
    case 'accepted':
      return 'Provider Accepted';
    case 'arriving':
      return 'Provider is En Route';
    case 'arrived':
      return 'Provider Has Arrived';
    case 'in_progress':
      return 'Service in Progress';
    case 'completed':
      return 'Service Completed';
    case 'cancelled':
      return 'Booking Cancelled';
    default:
      return status;
  }
}

function formatTime(timestamp: string) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  /* Custom Markers */
  driverMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerEmoji: {
    fontSize: 20,
  },
  pickupMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  /* Bottom Panel Card */
  card: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    maxHeight: '70%',
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  bookingNumber: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  badgeText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  vendorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  vendorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  vendorRating: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  chatButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  toggleButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  /* Timeline Styling */
  timelineSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLineContainer: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9CA3AF',
  },
  timelineDotActive: {
    backgroundColor: '#2563EB',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  eventTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  chatButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
});
