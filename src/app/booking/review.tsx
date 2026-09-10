import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { createBooking, uploadBookingMedia } from '../../api/bookings';
import { ServiceType } from '../../types/booking';

// Define the shape of your route params without extends Record
type ReviewBookingParams = {
  service?: string;
  pickupAddress?: string;
  pickupLatitude?: string;
  pickupLongitude?: string;
  destinationAddress?: string;
  destinationLatitude?: string;
  destinationLongitude?: string;
  problem?: string;
  estimatedAmount?: string;
  media?: string;
};

export default function ReviewBookingScreen(): React.JSX.Element {
  // Pass the type directly to useLocalSearchParams
  const params = useLocalSearchParams<ReviewBookingParams>();

  // Safely parse media array from JSON param without risk of crashing
  const media = useMemo(() => {
    if (!params.media) return [];
    try {
      const parsed = JSON.parse(params.media);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.media]);

  const { token } = useAuth();

  const [submitting, setSubmitting] = useState<boolean>(false);

  function serviceName(service?: string): string {
    if (!service) return 'N/A';
    switch (service) {
      case 'ride':
        return 'Ride';
      case 'mechanic':
        return 'Mechanic';
      case 'tow':
        return 'Tow';
      default:
        return service;
    }
  }

  async function confirmBooking(): Promise<void> {
    if (!token) {
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }
    if (submitting) return;

    let bookingId: number;

    try {
      setSubmitting(true);

      // Step 1: Create the main booking record
      const response = await createBooking(token, {
        service_type: (params.service as ServiceType) || 'mechanic',
        pickup_address: params.pickupAddress || '123 Main Street',
        pickup_latitude: Number(params.pickupLatitude) || 49.8951,
        pickup_longitude: Number(params.pickupLongitude) || -97.1384,
        destination_address: params.destinationAddress || '456 Portage Avenue',
        destination_latitude: params.destinationLatitude
          ? Number(params.destinationLatitude)
          : 49.8955,
        destination_longitude: params.destinationLongitude
          ? Number(params.destinationLongitude)
          : -97.142,
        problem_description: params.problem || 'My vehicle has a flat tire.',
        estimated_amount: params.estimatedAmount ? Number(params.estimatedAmount) : 85.0,
      });

      // Standardize response payload ID field
      bookingId = Number(response?.booking_id ?? response?.data?.booking_id ?? response?.data?.id);
      if (!response.success || !Number.isSafeInteger(bookingId) || bookingId <= 0) {
        throw new Error(response.message || 'The server did not return a valid booking ID.');
      }

      // Step 2: Upload media attachments if any exist
      if (media.length > 0) {
        try {
          await Promise.all(media.map((file: any) => uploadBookingMedia(token, bookingId, file)));
        } catch (mediaError) {
          console.warn('Some media uploads failed:', mediaError);
        }
      }

      /*
       * During development we manually trigger dispatch.
       * We'll automate this in the production version.
       */

      // Step 3: Navigate to searching screen
      router.replace({
        pathname: '/booking/searching',
        params: {
          bookingId: String(bookingId),
        },
      });
    } catch (error: any) {
      Alert.alert('Booking failed', error?.message || 'Unable to create booking.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Review Booking</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Service</Text>
        <Text style={styles.value}>{serviceName(params.service)}</Text>

        {params.problem && (
          <>
            <Text style={styles.label}>Problem</Text>
            <Text style={styles.value}>{params.problem}</Text>
          </>
        )}

        {media.length > 0 && (
          <>
            <Text style={styles.label}>Attachments</Text>
            <Text style={styles.value}>{media.length} file(s) attached</Text>
          </>
        )}
      </View>

      <Pressable
        onPress={confirmBooking}
        disabled={submitting}
        style={[styles.button, submitting && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>
          {submitting ? 'Creating booking...' : 'Confirm Booking'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 25,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
  },
  label: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 15,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5,
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 25,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
