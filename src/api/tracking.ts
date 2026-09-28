import { apiRequest } from './client';

export type TrackingData = {
  id: number;

  booking_number: string;

  service_type: string;

  status: string;

  pickup_latitude?: number;

  pickup_longitude?: number;

  destination_latitude?: number;

  destination_longitude?: number;

  vendor_id?: number;

  business_name?: string;

  phone?: string;

  profile_picture?: string;

  vehicle_type?: string;

  vehicle_make?: string;

  vehicle_model?: string;

  vehicle_color?: string;

  vehicle_plate?: string;

  rating?: number;

  last_latitude?: number;

  last_longitude?: number;

  current_heading?: number | null;

  current_speed?: number | null;

  location_updated_at?: string;
};

export type BookingEvent = {
  id: number;

  event_type: string;

  description: string;

  latitude?: number | null;

  longitude?: number | null;

  created_at: string;
};

export async function getTracking(token: string, bookingId: number) {
  return apiRequest<{
    success: boolean;

    message: string;

    data: {
      tracking: TrackingData;
    };
  }>(`bookings/tracking.php?booking_id=${bookingId}`, {
    method: 'GET',
    token,
  });
}

/* export async function getProgress(token: string, bookingId: number) {
  return apiRequest<{
    success: boolean;

    message: string;

    data: {
      booking: any;

      events: BookingEvent[];
    };
  }>(`bookings/progress.php?booking_id=${bookingId}`, {
    method: 'GET',
    token,
  });
} */

export interface BookingProgressData {
  booking: {
    id: number;
    booking_number: string;
    service_type: string;
    status: string;
    created_at: string;
    accepted_at: string | null;
    arrived_at: string | null;
    service_started_at: string | null;
    completed_at: string | null;
    vendor_id: number | null;
    business_name: string | null;
    phone: string | null;
    last_latitude: string | number | null;
    last_longitude: string | number | null;
    location_updated_at: string | null;
    is_online: number | null;
    rating: number | string | null;
    name: string | null;
    email: string | null;
    profile_picture: string | null;
  };
  events: BookingEvent[];
}

export async function getProgress(token: string, bookingId: number) {
  return apiRequest<{
    success: boolean;
    message: string;
    data: BookingProgressData;
  }>(`bookings/progress.php?booking_id=${bookingId}`, {
    method: 'GET',
    token,
  });
}
