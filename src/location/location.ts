import * as Location from 'expo-location';

export type UserLocation = {
  latitude: number;
  longitude: number;
};

/**
 * Check whether the device's Location Services are enabled.
 */
export async function isLocationServicesEnabled(): Promise<boolean> {
  return await Location.hasServicesEnabledAsync();
}

/**
 * Request foreground location permission.
 */
export async function requestLocationPermission(): Promise<boolean> {
  const servicesEnabled = await isLocationServicesEnabled();

  if (!servicesEnabled) {
    throw new Error(
      'Location services are disabled. Please enable Location Services on your device.'
    );
  }

  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== Location.PermissionStatus.GRANTED) {
    throw new Error('Location permission is required to use this service.');
  }

  return true;
}

/**
 * Get the user's current location.
 */
export async function getCurrentLocation(): Promise<UserLocation> {
  await requestLocationPermission();

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}
