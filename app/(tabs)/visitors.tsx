import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { format } from 'date-fns';
import { Plus, User, Clock, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme-store';
import { getVisitors } from '@/lib/supabase';

type VisitorItem = {
  id: string;
  name: string;
  company: string;
  date: Date;
  status: 'scheduled' | 'checked-in' | 'checked-out';
  host: string;
};

// Fallback mock data in case Supabase fetch fails
const MOCK_VISITORS: VisitorItem[] = Array(10).fill(0).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 10));
  
  const statuses: VisitorItem['status'][] = ['scheduled', 'checked-in', 'checked-out'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    id: `visitor-${i}`,
    name: `Visitor ${i + 1}`,
    company: `Company ${String.fromCharCode(65 + i % 26)}`,
    date: date,
    status,
    host: `Employee ${i % 5 + 1}`,
  };
});

export default function VisitorsScreen() {
  const { isDark } = useTheme();
  const [visitors, setVisitors] = useState<VisitorItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'checked-in' | 'checked-out'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        setLoading(true);
        const visitorsData = await getVisitors();
        
        if (visitorsData && visitorsData.length > 0) {
          const formattedData = visitorsData.map((item: any) => ({
            id: item.id,
            name: item.visitor_name,
            company: item.company || 'Not specified',
            date: new Date(item.date),
            status: item.status || 'scheduled',
            host: item.host_name || 'Not assigned',
          }));
          
          setVisitors(formattedData);
        } else {
          // If no data from Supabase, use mock data
          setVisitors(MOCK_VISITORS);
        }
      } catch (error) {
        console.error('Error fetching visitors:', error);
        Alert.alert('Error', 'Failed to load visitors');
        // Fallback to mock data
        setVisitors(MOCK_VISITORS);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitors();
  }, []);

  const filteredVisitors = visitors.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getStatusColor = (status: VisitorItem['status']) => {
    switch (status) {
      case 'scheduled':
        return Colors.warning;
      case 'checked-in':
        return Colors.success;
      case 'checked-out':
        return Colors.inactive.light;
      default:
        return Colors.inactive.light;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? Colors.text.dark : Colors.text.light,
    },
    addButton: {
      backgroundColor: Colors.primary.default,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
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
      fontSize: 12,
      color: isDark ? Colors.inactive.dark : Colors.inactive.light,
    },
    filterTextActive: {
      color: Colors.primary.default,
      fontWeight: '600',
    },
    visitorItem: {
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
    },
    visitorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 16,
    },
    visitorInfo: {
      flex: 1,
    },
    visitorName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    visitorCompany: {
      fontSize: 14,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    visitorDetails: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    detailIcon: {
      marginRight: 8,
    },
    detailText: {
      fontSize: 14,
    },
    visitorFooter: {
      borderTopWidth: 1,
      borderTopColor: isDark ? Colors.border.dark : Colors.border.light,
      padding: 12,
    },
    viewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewButtonText: {
      color: Colors.primary.default,
      fontSize: 14,
      fontWeight: '500',
      marginRight: 4,
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

  const renderItem = ({ item }: { item: VisitorItem }) => {
    return (
      <TouchableOpacity 
        style={[
          styles.visitorItem, 
          { backgroundColor: isDark ? Colors.card.dark : Colors.card.light }
        ]}
      >
        <View style={styles.visitorHeader}>
          <View style={styles.visitorInfo}>
            <Text style={[styles.visitorName, { color: isDark ? Colors.text.dark : Colors.text.light }]}>
              {item.name}
            </Text>
            <Text style={[styles.visitorCompany, { color: isDark ? Colors.inactive.dark : Colors.inactive.light }]}>
              {item.company}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace('-', ' ')}
            </Text>
          </View>
        </View>
        
        <View style={styles.visitorDetails}>
          <View style={styles.detailItem}>
            <Clock size={16} color={isDark ? Colors.inactive.dark : Colors.inactive.light} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: isDark ? Colors.inactive.dark : Colors.inactive.light }]}>
              {format(item.date, 'MMM d, yyyy • h:mm a')}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <User size={16} color={isDark ? Colors.inactive.dark : Colors.inactive.light} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: isDark ? Colors.inactive.dark : Colors.inactive.light }]}>
              Host: {item.host}
            </Text>
          </View>
        </View>
        
        <View style={styles.visitorFooter}>
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <ArrowRight size={16} color={Colors.primary.default} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['right', 'left']}>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading visitors...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Visitors</Text>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
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
              filter === 'scheduled' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('scheduled')}
          >
            <Text style={[
              styles.filterText,
              filter === 'scheduled' && styles.filterTextActive
            ]}>Scheduled</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filter === 'checked-in' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('checked-in')}
          >
            <Text style={[
              styles.filterText,
              filter === 'checked-in' && styles.filterTextActive
            ]}>Checked In</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filter === 'checked-out' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('checked-out')}
          >
            <Text style={[
              styles.filterText,
              filter === 'checked-out' && styles.filterTextActive
            ]}>Checked Out</Text>
          </TouchableOpacity>
        </View>
        
        {filteredVisitors.length > 0 ? (
          <FlatList
            data={filteredVisitors}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No visitors found</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}