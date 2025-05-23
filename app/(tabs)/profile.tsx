import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { User, Settings, Bell, HelpCircle, LogOut, Moon } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme-store';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, getUserProfile } from '@/lib/supabase';

export default function ProfileScreen() {
  const { isDark, theme, setTheme } = useTheme();
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
            email: currentUser.email,
            firstName: profile?.first_name || '',
            lastName: profile?.last_name || '',
            department: profile?.department || 'Not specified',
            position: profile?.position || 'Not specified',
            profileImage: profile?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(isDark ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    profileHeader: {
      alignItems: 'center',
      marginBottom: 30,
    },
    profileImageContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      overflow: 'hidden',
      marginBottom: 16,
      borderWidth: 3,
      borderColor: Colors.primary.default,
    },
    profileImage: {
      width: '100%',
      height: '100%',
    },
    profileName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? Colors.text.dark : Colors.text.light,
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 16,
      color: isDark ? Colors.inactive.dark : Colors.inactive.light,
      marginBottom: 8,
    },
    profilePosition: {
      fontSize: 14,
      color: Colors.primary.default,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      color: isDark ? Colors.text.dark : Colors.text.light,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? Colors.border.dark : Colors.border.light,
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    menuText: {
      flex: 1,
      fontSize: 16,
      color: isDark ? Colors.text.dark : Colors.text.light,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
      paddingVertical: 16,
      borderRadius: 8,
      marginTop: 20,
    },
    logoutText: {
      color: Colors.error,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    notificationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    themeText: {
      fontSize: 14,
      color: isDark ? Colors.inactive.dark : Colors.inactive.light,
      marginTop: 4,
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
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: user?.profileImage }} 
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.profileName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.profilePosition}>{user?.position} • {user?.department}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <User size={20} color={Colors.primary.default} />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Settings size={20} color={Colors.primary.default} />
            </View>
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
          
          <View style={[styles.menuItem, styles.notificationRow]}>
            <View style={styles.menuIcon}>
              <Bell size={20} color={Colors.primary.default} />
            </View>
            <Text style={styles.menuText}>Notifications</Text>
            <Switch 
              trackColor={{ false: isDark ? '#3A3A3A' : '#D1D1D1', true: `${Colors.primary.default}80` }}
              thumbColor={Colors.primary.default}
              value={true}
            />
          </View>

          <View style={[styles.menuItem, styles.notificationRow]}>
            <View style={styles.menuIcon}>
              <Moon size={20} color={Colors.primary.default} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuText}>Dark Mode</Text>
              <Text style={styles.themeText}>
                {theme === 'system' ? 'Using system setting' : theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}
              </Text>
            </View>
            <Switch 
              trackColor={{ false: isDark ? '#3A3A3A' : '#D1D1D1', true: `${Colors.primary.default}80` }}
              thumbColor={Colors.primary.default}
              value={theme === 'dark' || (theme === 'system' && isDark)}
              onValueChange={toggleTheme}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <HelpCircle size={20} color={Colors.primary.default} />
            </View>
            <Text style={styles.menuText}>Help & Support</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}