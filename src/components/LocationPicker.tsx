import { getCurrentLocation } from '@/location/location';
import { useEffect, useState } from 'react';

import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

import MapView, { Marker, MapPressEvent } from 'react-native-maps';

export type SelectedLocation = {
  latitude: number;
  longitude: number;
  address?: string;
};

type Props = {
  value?: SelectedLocation | null;
  onChange: (location: SelectedLocation) => void;
};

export default function LocationPicker({ value, onChange }: Props) {
  const [location, setLocation] = useState<SelectedLocation | null>(value ?? null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!value) {
      loadCurrentLocation();
    }
  }, []);

  async function loadCurrentLocation() {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

      const current = await getCurrentLocation();

      const currentLocation: SelectedLocation = {
        latitude: current.latitude,
        longitude: current.longitude,
        address: 'Current Location',
      };

      setLocation(currentLocation);

      onChange(currentLocation);
    } catch (error) {
      console.error('LOCATION PICKER ERROR:', error);

      const message =
        error instanceof Error ? error.message : 'Unable to determine your current location.';

      Alert.alert('Location error', message);
    } finally {
      setLoading(false);
    }
  }

  function selectLocation(event: MapPressEvent) {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    const selected: SelectedLocation = {
      latitude,
      longitude,
      address: 'Selected map pin',
    };

    setLocation(selected);

    onChange(selected);
  }

  const initialRegion = {
    latitude: location?.latitude ?? 49.8951,
    longitude: location?.longitude ?? -97.1384,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Where should the service happen?</Text>

      <Text style={styles.description}>Tap the map to select the exact location.</Text>

      <MapView style={styles.map} initialRegion={initialRegion} onPress={selectLocation}>
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Service location"
            description={location.address ?? 'Selected service location'}
          />
        )}
      </MapView>

      <TouchableOpacity
        style={[styles.currentButton, loading && styles.currentButtonDisabled]}
        onPress={loadCurrentLocation}
        disabled={loading}>
        <Text style={styles.currentText}>
          {loading ? 'Getting your location...' : '📍 Use my current location'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },

  title: {
    fontSize: 17,
    fontWeight: '900',
  },

  description: {
    color: '#6B7280',
    marginTop: 5,
    marginBottom: 10,
  },

  map: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    overflow: 'hidden',
  },

  currentButton: {
    marginTop: 10,
    backgroundColor: '#DCFCE7',
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
  },

  currentButtonDisabled: {
    opacity: 0.6,
  },

  currentText: {
    color: '#166534',
    fontWeight: '900',
  },
});
