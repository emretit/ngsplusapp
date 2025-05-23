import { Tabs } from 'expo-router';
import { Home, History, User, Users } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme-store';

function CustomTabBarButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.scanButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.scanButtonInner}>
        {/* QR code icon */}
        <View style={styles.qrCodeContainer}>
          <View style={styles.qrRow}>
            <View style={styles.qrSquare} />
            <View style={styles.qrSquare} />
            <View style={styles.qrSquare} />
          </View>
          <View style={styles.qrRow}>
            <View style={styles.qrSquare} />
            <View style={styles.qrEmptySquare} />
            <View style={styles.qrSquare} />
          </View>
          <View style={styles.qrRow}>
            <View style={styles.qrSquare} />
            <View style={styles.qrSquare} />
            <View style={styles.qrSquare} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary.default,
        tabBarInactiveTintColor: isDark ? Colors.inactive.dark : Colors.inactive.light,
        tabBarStyle: {
          backgroundColor: isDark ? Colors.tabBar.dark : Colors.tabBar.light,
          borderTopColor: isDark ? Colors.border.dark : Colors.border.light,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
        },
        headerTintColor: isDark ? Colors.text.dark : Colors.text.light,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <History size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: '',
          tabBarButton: (props) => (
            <CustomTabBarButton
              onPress={() => router.push('/(tabs)/scan')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: 'Visitors',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanButton: {
    top: -22, // Moved up slightly to make it more prominent
    justifyContent: 'center',
    alignItems: 'center',
    width: 80, // Increased width
    height: 80, // Increased height
  },
  scanButtonInner: {
    width: 65, // Increased size
    height: 65, // Increased size
    borderRadius: 32.5, // Half of width/height for perfect circle
    backgroundColor: Colors.primary.default,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
    elevation: 6,
  },
  qrCodeContainer: {
    width: 32, // Slightly larger QR code
    height: 32, // Slightly larger QR code
    justifyContent: 'space-between',
  },
  qrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 9,
  },
  qrSquare: {
    width: 9,
    height: 9,
    backgroundColor: '#FFFFFF',
    margin: 1,
  },
  qrEmptySquare: {
    width: 9,
    height: 9,
    backgroundColor: 'transparent',
    margin: 1,
  },
});