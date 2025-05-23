import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { Clock, Calendar, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme-store';
import { getCurrentUser, getUserProfile } from '@/lib/supabase';

export default function HomeScreen() {
  const { isDark } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          const profile = await getUserProfile(currentUser.id);
          
          setUser({
            id: currentUser.id,
            firstName: profile?.first_name || 'User',
            lastName: profile?.last_name || '',
            checkedIn: profile?.last_check_in ? true : false,
            checkedInTime: profile?.last_check_in || null,
            checkedOutTime: profile?.last_check_out || null,
            stats: {
              daysThisMonth: 22,
              daysPresent: profile?.days_present || 18,
              timesLate: profile?.times_late || 2,
            }
          });
        } else {
          // Fallback to mock data if no user
          setUser({
            firstName: 'John',
            lastName: 'Doe',
            checkedIn: false,
            checkedInTime: null,
            checkedOutTime: null,
            stats: {
              daysThisMonth: 22,
              daysPresent: 18,
              timesLate: 2,
            }
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load user data');
        
        // Fallback to mock data
        setUser({
          firstName: 'John',
          lastName: 'Doe',
          checkedIn: false,
          checkedInTime: null,
          checkedOutTime: null,
          stats: {
            daysThisMonth: 22,
            daysPresent: 18,
            timesLate: 2,
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);
  
  const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getAttendanceStatus = () => {
    if (!user?.checkedIn) {
      return {
        message: "You haven't checked in today.",
        buttonText: "Scan QR to Check In",
        buttonDisabled: false,
      };
    } else if (user?.checkedIn && !user?.checkedOutTime) {
      return {
        message: `Checked in at ${user?.checkedInTime ? format(new Date(user.checkedInTime), 'h:mm a') : '9:00 AM'}`,
        buttonText: "Scan QR to Check Out",
        buttonDisabled: false,
      };
    } else {
      return {
        message: `You checked out at ${user?.checkedOutTime ? format(new Date(user.checkedOutTime), 'h:mm a') : '5:30 PM'}`,
        buttonText: "Already Checked Out",
        buttonDisabled: true,
      };
    }
  };

  const status = user ? getAttendanceStatus() : {
    message: "Loading your status...",
    buttonText: "Scan QR to Check In",
    buttonDisabled: true,
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
    },
    content: {
      padding: 20,
    },
    header: {
      marginBottom: 24,
    },
    greeting: {
      fontSize: 28,
      fontWeight: 'bold',
      color: isDark ? Colors.text.dark : Colors.text.light,
    },
    name: {
      fontSize: 28,
      fontWeight: 'bold',
      color: Colors.primary.default,
    },
    date: {
      fontSize: 16,
      color: isDark ? Colors.inactive.dark : Colors.inactive.light,
      marginTop: 4,
    },
    card: {
      backgroundColor: isDark ? Colors.card.dark : Colors.card.light,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: isDark ? 0.1 : 0.1,
      shadowRadius: 3.84,
      elevation: 3,
    },
    statusTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
      color: isDark ? Colors.text.dark : Colors.text.light,
    },
    statusMessage: {
      fontSize: 16,
      marginBottom: 20,
      color: isDark ? Colors.text.dark : Colors.text.light,
    },
    button: {
      backgroundColor: Colors.primary.default,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonDisabled: {
      backgroundColor: isDark ? '#3A3A3A' : '#CCCCCC',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statCard: {
      flex: 1,
      backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 5,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: isDark ? 0.2 : 0.1,
      shadowRadius: 2.22,
      elevation: 2,
    },
    statIcon: {
      marginBottom: 8,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors.primary.default,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? Colors.inactive.dark : Colors.inactive.light,
      textAlign: 'center',
    },
    quote: {
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 20,
      color: isDark ? Colors.inactive.dark : Colors.inactive.light,
      paddingHorizontal: 20,
    },
    loadingText: {
      textAlign: 'center',
      marginTop: 20,
      color: isDark ? Colors.text.dark : Colors.text.light,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['right', 'left']}>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>{user.firstName}</Text>
          <Text style={styles.date}>{currentDate}</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.statusTitle}>Today's Attendance</Text>
          <Text style={styles.statusMessage}>{status.message}</Text>
          <TouchableOpacity 
            style={[styles.button, status.buttonDisabled && styles.buttonDisabled]} 
            disabled={status.buttonDisabled}
            onPress={() => router.push('/(tabs)/scan')}
          >
            <Text style={styles.buttonText}>{status.buttonText}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.statusTitle}>Monthly Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Calendar size={24} color={Colors.primary.default} style={styles.statIcon} />
              <Text style={styles.statValue}>{user.stats.daysThisMonth}</Text>
              <Text style={styles.statLabel}>Working Days This Month</Text>
            </View>
            
            <View style={styles.statCard}>
              <Clock size={24} color={Colors.primary.default} style={styles.statIcon} />
              <Text style={styles.statValue}>{user.stats.daysPresent}</Text>
              <Text style={styles.statLabel}>Days Present</Text>
            </View>
            
            <View style={styles.statCard}>
              <AlertTriangle size={24} color={Colors.warning} style={styles.statIcon} />
              <Text style={[styles.statValue, { color: Colors.warning }]}>{user.stats.timesLate}</Text>
              <Text style={styles.statLabel}>Times Late</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.quote}>
          "The key to success is to focus on goals, not obstacles."
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}