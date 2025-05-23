import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { Link, router } from 'expo-router';
import Colors from '@/constants/colors';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme-store';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { isDark } = useTheme();

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      setError('Lütfen e-posta/telefon ve şifre giriniz');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Determine if input is email or phone
      const isEmail = emailOrPhone.includes('@');
      let email = isEmail ? emailOrPhone : '';
      let phone = !isEmail ? emailOrPhone : '';

      // Use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email || phone, // Supabase will handle validation
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Successfully logged in
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <ScrollView 
        contentContainerStyle={[
          styles.container, 
          { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={[styles.logoCircle, { backgroundColor: Colors.primary.default }]}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={[styles.appName, { color: isDark ? Colors.text.dark : Colors.text.light }]}>
            PDKS Sistemi
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? Colors.inactive.dark : Colors.inactive.light }]}>
            Personel Devam Kontrol Sistemi
          </Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: isDark ? Colors.card.dark : '#FFFFFF' }]}>
          <Text style={[styles.title, { color: isDark ? Colors.text.dark : Colors.text.light }]}>
            Giriş Yap
          </Text>
          
          <Text style={[styles.formSubtitle, { color: isDark ? Colors.inactive.dark : Colors.inactive.light }]}>
            PDKS sistemine giriş yapmak için e-posta veya telefon numaranızı giriniz
          </Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper, 
              { 
                backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                borderColor: isDark ? Colors.border.dark : Colors.border.light 
              }
            ]}>
              <Feather name="user" size={20} color={isDark ? '#888888' : '#999999'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: isDark ? Colors.text.dark : Colors.text.light }]}
                placeholder="E-posta veya telefon numarası"
                placeholderTextColor={isDark ? '#888888' : '#999999'}
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            
            <View style={[
              styles.inputWrapper, 
              { 
                backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                borderColor: isDark ? Colors.border.dark : Colors.border.light 
              }
            ]}>
              <Feather name="lock" size={20} color={isDark ? '#888888' : '#999999'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: isDark ? Colors.text.dark : Colors.text.light }]}
                placeholder="Şifre"
                placeholderTextColor={isDark ? '#888888' : '#999999'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Feather 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={isDark ? '#888888' : '#999999'} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.linkContainer}>
            <Text style={{ color: isDark ? Colors.inactive.dark : Colors.inactive.light }}>
              Hesabınız yok mu?
            </Text>
            <Link href="/auth/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Kayıt olun</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 450,
    padding: 30,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: Colors.primary.default,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  linkText: {
    color: Colors.primary.default,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error,
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
  },
});