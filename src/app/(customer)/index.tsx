import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.small}>Hello,</Text>
          <Text style={styles.name}>{user?.name || 'Guest'}</Text>
        </View>

        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <Text style={{ fontSize: 25 }}>🔔</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.heading}>What do you need?</Text>

      <View style={styles.grid}>
        <ServiceCard title="Ride" description="Book a ride" service="ride" />
        <ServiceCard title="Mechanic" description="Get roadside help" service="mechanic" />
        <ServiceCard title="Tow" description="Tow my vehicle" service="tow" />
        <ServiceCard title="Parts" description="Buy spare parts" service="parts" />
      </View>
    </ScrollView>
  );
}

function ServiceCard({
  title,
  description,
  service,
}: {
  title: string;
  description: string;
  service: string;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/booking/booking',
          params: { service },
        })
      }>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  header: {
    marginTop: 30,
    marginBottom: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  small: {
    color: '#6B7280',
    fontSize: 15,
  },
  name: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    minHeight: 140,
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  cardDescription: {
    color: '#6B7280',
    marginTop: 8,
  },
});
