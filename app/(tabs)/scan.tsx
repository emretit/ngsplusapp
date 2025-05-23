import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useTheme } from '@/hooks/use-theme-store';
import { supabase, getCurrentUser, recordAttendance } from '@/lib/supabase';

export default function ScanScreen() {
  const { isDark } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    try {
      setScanned(true);
      setLoading(true);
      
      // Parse the QR code data
      let locationData;
      try {
        locationData = JSON.parse(data);
      } catch (e) {
        // If not JSON, try to use as a location ID directly
        locationData = { id: data, name: 'Unknown Location' };
      }
      
      if (!locationData.id) {
        throw new Error('Invalid QR code');
      }
      
      // Get current user
      const user = await getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Check if user is already checked in
      const { data: profileData } = await supabase
        .from('profiles')
        .select('last_check_in, last_check_out')
        .eq('id', user.id)
        .single();
      
      // Determine if this is a check-in or check-out
      const isCheckIn = !profileData?.last_check_in || profileData?.last_check_out;
      const actionType = isCheckIn ? 'check-in' : 'check-out';
      
      // Record attendance
      await recordAttendance(user.id, actionType, locationData.id);
      
      // Update user profile with latest check-in/out
      const now = new Date().toISOString();
      const updateData = isCheckIn 
        ? { last_check_in: now, last_check_out: null }
        : { last_check_out: now };
      
      await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      // Show success message
      Alert.alert(
        isCheckIn ? 'Checked In' : 'Checked Out',
        `You have successfully ${isCheckIn ? 'checked in to' : 'checked out from'} ${locationData.name || 'this location'}.`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
      
    } catch (error: any) {
      console.error('Scan error:', error);
      Alert.alert('Error', error.message || 'Failed to process QR code');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
    },
    scannerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scanner: {
      width: '100%',
      height: '70%',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scanFrame: {
      width: 250,
      height: 250,
      borderWidth: 2,
      borderColor: Colors.primary.default,
      borderRadius: 12,
    },
    instructions: {
      position: 'absolute',
      bottom: 100,
      left: 20,
      right: 20,
      backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    instructionsText: {
      color: isDark ? Colors.text.dark : Colors.text.light,
      fontSize: 16,
      textAlign: 'center',
    },
    button: {
      marginTop: 16,
      backgroundColor: Colors.primary.default,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    permissionText: {
      fontSize: 16,
      color: isDark ? Colors.text.dark : Colors.text.light,
      textAlign: 'center',
      marginBottom: 20,
    },
  });

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container} edges={['right', 'left']}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container} edges={['right', 'left']}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera permission is required to scan QR codes for attendance.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => BarCodeScanner.requestPermissionsAsync()}
          >
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.scanner}
        />
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
        </View>
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            {loading 
              ? 'Processing...' 
              : 'Position the QR code within the frame to scan for attendance'}
          </Text>
          {scanned && !loading && (
            <TouchableOpacity 
              style={styles.button}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.buttonText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}