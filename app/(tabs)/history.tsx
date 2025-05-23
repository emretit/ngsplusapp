import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { format } from 'date-fns';
import { ArrowRight, LogIn, LogOut } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme-store';
import { getAttendanceHistory, getCurrentUser } from '@/lib/supabase';

type HistoryItem = {
  id: string;
  timestamp: Date;
  type: 'check-in' | 'check-out';
  location: string;
};

// Fallback mock data in case Supabase fetch fails
const MOCK_HISTORY: HistoryItem[] = Array(20).fill(0).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i);
  
  const isCheckIn = i % 2 === 0;
  const hour = isCheckIn ? 8 + Math.floor(Math.random() * 2) : 17 + Math.floor(Math.random() * 2);
  const minute = Math.floor(Math.random() * 60);
  
  date.setHours(hour, minute);
  
  return {
    id: `history-${i}`,
    timestamp: date,
    type: isCheckIn ? 'check-in' : 'check-out',
    location: 'Main Office',
  };
});

export default function HistoryScreen() {
  const { isDark } = useTheme();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'check-in' | 'check-out'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        
        if (user) {
          const attendanceData = await getAttendanceHistory(user.id);
          
          if (attendanceData && attendanceData.length > 0) {
            const formattedData = attendanceData.map((item: any) => ({
              id: item.id,
              timestamp: new Date(item.timestamp),
              type: item.type,
              location: item.location_name || 'Main Office',
            }));
            
            setHistory(formattedData);
          } else {
            // If no data from Supabase, use mock data
            setHistory(MOCK_HISTORY);
          }
        } else {
          // If no user, use mock data
          setHistory(MOCK_HISTORY);
        }
      } catch (error) {
        console.error('Error fetching attendance history:', error);
        Alert.alert('Error', 'Failed to load attendance history');
        // Fallback to mock data
        setHistory(MOCK_HISTORY);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceHistory();
  }, []);

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    filterContainer: {
      flexDirection: 'row',
      marginBottom: 16,
      backgroundColor: isDark ? Colors.card.dark : Colors.card.light,
      borderRadius: 8,
      padding: 4,
    },
    filterButton: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 6,
    },
    filterButtonActive: {
      backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
    },
    filterText: {
      fontSize: 14,
      color: isDark ? Colors.inactive.dark : Colors.inactive.light,
    },
    filterTextActive: {
      color: Colors.primary.default,
      fontWeight: '600',
    },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    historyDetails: {
      flex: 1,
    },
    historyType: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    historyLocation: {
      fontSize: 14,
    },
    historyTime: {
      alignItems: 'flex-end',
      marginRight: 12,
    },
    historyDate: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 2,
    },
    historyHour: {
      fontSize: 12,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? Colors.inactive.dark : Colors.inactive.light,
      textAlign: 'center',
    },
    loadingText: {
      textAlign: 'center',
      marginTop: 20,
      color: isDark ? Colors.text.dark : Colors.text.light,
    },
  });

  const renderItem = ({ item }: { item: HistoryItem }) => {
    return (
      <View style={[
        styles.historyItem, 
        { backgroundColor: isDark ? Colors.card.dark : Colors.card.light }
      ]}>
        <View style={styles.iconContainer}>
          {item.type === 'check-in' ? (
            <LogIn size={20} color={Colors.success} />
          ) : (
            <LogOut size={20} color={Colors.primary.default} />
          )}
        </View>
        <View style={styles.historyDetails}>
          <Text style={[styles.historyType, { color: isDark ? Colors.text.dark : Colors.text.light }]}>
            {item.type === 'check-in' ? 'Check In' : 'Check Out'}
          </Text>
          <Text style={[styles.historyLocation, { color: isDark ? Colors.inactive.dark : Colors.inactive.light }]}>
            {item.location}
          </Text>
        </View>
        <View style={styles.historyTime}>
          <Text style={[styles.historyDate, { color: isDark ? Colors.text.dark : Colors.text.light }]}>
            {format(item.timestamp, 'MMM d, yyyy')}
          </Text>
          <Text style={[styles.historyHour, { color: isDark ? Colors.inactive.dark : Colors.inactive.light }]}>
            {format(item.timestamp, 'h:mm a')}
          </Text>
        </View>
        <ArrowRight size={16} color={isDark ? Colors.inactive.dark : Colors.inactive.light} />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['right', 'left']}>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading attendance history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <View style={styles.content}>
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filter === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive
            ]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filter === 'check-in' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('check-in')}
          >
            <Text style={[
              styles.filterText,
              filter === 'check-in' && styles.filterTextActive
            ]}>Check In</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filter === 'check-out' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('check-out')}
          >
            <Text style={[
              styles.filterText,
              filter === 'check-out' && styles.filterTextActive
            ]}>Check Out</Text>
          </TouchableOpacity>
        </View>
        
        {filteredHistory.length > 0 ? (
          <FlatList
            data={filteredHistory}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No attendance records found</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}