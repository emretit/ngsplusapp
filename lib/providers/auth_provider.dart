import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/supabase_config.dart';

enum UserType { admin, employee }

class AuthUser {
  final String id;
  final String email;
  final String? firstName;
  final String? lastName;
  final UserType userType;

  AuthUser({
    required this.id,
    required this.email,
    this.firstName,
    this.lastName,
    required this.userType,
  });
}

class AuthProvider extends ChangeNotifier {
  User? _supabaseUser;
  AuthUser? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  User? get supabaseUser => _supabaseUser;
  AuthUser? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _currentUser != null;

  AuthProvider() {
    _supabaseUser = supabase.auth.currentUser;
    if (_supabaseUser != null) {
      _currentUser = AuthUser(
        id: _supabaseUser!.id,
        email: _supabaseUser!.email!,
        firstName: _supabaseUser!.userMetadata?['first_name'],
        lastName: _supabaseUser!.userMetadata?['last_name'],
        userType: UserType.admin,
      );
    }
    _setupAuthListener();
  }

  void _setupAuthListener() {
    supabase.auth.onAuthStateChange.listen((event) {
      _supabaseUser = event.session?.user;
      if (_supabaseUser != null) {
        _currentUser = AuthUser(
          id: _supabaseUser!.id,
          email: _supabaseUser!.email!,
          firstName: _supabaseUser!.userMetadata?['first_name'],
          lastName: _supabaseUser!.userMetadata?['last_name'],
          userType: UserType.admin,
        );
      } else {
        _currentUser = null;
      }
      notifyListeners();
    });
  }

  // Yönetici girişi (Supabase Auth)
  Future<bool> signInAdmin(String email, String password) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final response = await supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );

      _supabaseUser = response.user;
      if (_supabaseUser != null) {
        _currentUser = AuthUser(
          id: _supabaseUser!.id,
          email: _supabaseUser!.email!,
          firstName: _supabaseUser!.userMetadata?['first_name'],
          lastName: _supabaseUser!.userMetadata?['last_name'],
          userType: UserType.admin,
        );
      }
      
      _isLoading = false;
      notifyListeners();
      
      return _currentUser != null;
    } catch (error) {
      _isLoading = false;
      _errorMessage = 'Yönetici girişi başarısız: ${error.toString()}';
      notifyListeners();
      return false;
    }
  }

  // Çalışan girişi (Özel sistem)
  Future<bool> signInEmployee(String email, String password) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final response = await supabase.functions.invoke(
        'employee-login',
        body: {
          'email': email,
          'password': password,
        },
      );

      if (response.status == 200 && response.data['user'] != null) {
        final userData = response.data['user'];
        _currentUser = AuthUser(
          id: userData['id'].toString(),
          email: userData['email'],
          firstName: userData['name']?.split(' ')[0],
          lastName: userData['name']?.split(' ').length > 1 ? userData['name']?.split(' ')[1] : '',
          userType: UserType.employee,
        );
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _isLoading = false;
        _errorMessage = 'Geçersiz e-posta veya şifre';
        notifyListeners();
        return false;
      }
    } catch (error) {
      _isLoading = false;
      _errorMessage = 'Çalışan girişi başarısız: ${error.toString()}';
      notifyListeners();
      return false;
    }
  }

  // Eski signIn metodunu koruyarak geriye uyumluluk sağlayalım
  Future<bool> signIn(String email, String password) async {
    return await signInAdmin(email, password);
  }

  Future<bool> signUp(String email, String password, String firstName, String lastName) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final response = await supabase.auth.signUp(
        email: email,
        password: password,
        data: {
          'first_name': firstName,
          'last_name': lastName,
        },
      );

      _supabaseUser = response.user;
      _currentUser = AuthUser(
        id: _supabaseUser!.id,
        email: _supabaseUser!.email!,
        firstName: _supabaseUser!.userMetadata?['first_name'],
        lastName: _supabaseUser!.userMetadata?['last_name'],
        userType: UserType.admin,
      );
      _isLoading = false;
      notifyListeners();
      
      return _currentUser != null;
    } catch (error) {
      _isLoading = false;
      _errorMessage = error.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> resetPassword(String email) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      await supabase.auth.resetPasswordForEmail(email);

      _isLoading = false;
      notifyListeners();
      
      return true;
    } catch (error) {
      _isLoading = false;
      _errorMessage = error.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> signOut() async {
    try {
      // Eğer admin ise Supabase auth'dan çıkış yap
      if (_currentUser?.userType == UserType.admin && _supabaseUser != null) {
        await supabase.auth.signOut();
      }
      
      // Her durumda local state'i temizle
      _supabaseUser = null;
      _currentUser = null;
      notifyListeners();
    } catch (error) {
      _errorMessage = error.toString();
      // Hata olsa bile local state'i temizle
      _supabaseUser = null;
      _currentUser = null;
      notifyListeners();
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
} 