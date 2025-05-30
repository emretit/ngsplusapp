import 'package:flutter/material.dart';
import '../config/supabase_config.dart';
import '../models/attendance.dart';
import 'auth_provider.dart';

class AttendanceProvider extends ChangeNotifier {
  List<Attendance> _attendanceRecords = [];
  bool _isLoading = false;
  String? _errorMessage;
  Attendance? _todayAttendance;
  AuthProvider? _authProvider;

  List<Attendance> get attendanceRecords => _attendanceRecords;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  Attendance? get todayAttendance => _todayAttendance;

  bool get hasCheckedInToday => _todayAttendance?.checkInTime != null;
  bool get hasCheckedOutToday => _todayAttendance?.checkOutTime != null;

  void setAuthProvider(AuthProvider authProvider) {
    _authProvider = authProvider;
  }

  Future<void> loadAttendanceRecords() async {
    try {
      _isLoading = true;
      notifyListeners();

      final currentUser = _authProvider?.currentUser;
      if (currentUser == null) return;

      // Çalışanlar için card_readings tablosundan veri çek (devices tablosuyla join)
      if (currentUser.userType == UserType.employee) {
        print('Loading card_readings for employee ID: ${currentUser.id}');
        
        final response = await supabase
            .from('card_readings')
            .select('''
              *,
              devices!card_readings_device_id_fkey (
                id,
                name,
                location,
                device_location
              )
            ''')
            .eq('employee_id', int.parse(currentUser.id))
            .order('access_time', ascending: false)
            .limit(50);

        print('Found ${response.length} card_readings records');

        _attendanceRecords = (response as List)
            .map((record) {
              // Devices tablosundan kapı bilgisini al
              final device = record['devices'];
              final doorName = device != null 
                  ? '${device['name']} (${device['device_location'] ?? device['location']})'
                  : record['device_location'] ?? 'Bilinmeyen Kapı';
              
              // Card readings formatını Attendance formatına dönüştür
              final formattedRecord = {
                'id': record['id'],
                'user_id': record['employee_id']?.toString(),
                'employee_id': record['employee_id'],
                'type': record['raw_data'] == 'check_in' ? 'check_in' : 'check_out',
                'created_at': record['access_time'],
                'access_time': record['access_time'],
                'door_name': doorName,
                'device_location': record['device_location'],
                'employee_name': record['employee_name'],
                'status': record['status'],
              };
              return Attendance.fromJson(formattedRecord);
            })
            .toList();
            
        print('Parsed ${_attendanceRecords.length} attendance records');
      } else {
        // Adminler için direkt veritabanı sorgusu
        final response = await supabase
            .from('pdks_records')
            .select()
            .order('created_at', ascending: false)
            .limit(50);

        _attendanceRecords = (response as List)
            .map((record) => Attendance.fromJson(record))
            .toList();
      }

      await _loadTodayAttendance();

      _isLoading = false;
      notifyListeners();
    } catch (error) {
      _isLoading = false;
      _errorMessage = error.toString();
      notifyListeners();
    }
  }

  Future<void> _loadTodayAttendance() async {
    final currentUser = _authProvider?.currentUser;
    if (currentUser == null) return;

    final today = DateTime.now();
    final startOfDay = DateTime(today.year, today.month, today.day);
    final endOfDay = startOfDay.add(const Duration(days: 1));

    List<dynamic> response;

    if (currentUser.userType == UserType.employee) {
      // Çalışanlar için bugünkü card_readings kayıtlarını al (devices tablosuyla join)
      final cardReadings = await supabase
          .from('card_readings')
          .select('''
            *,
            devices!card_readings_device_id_fkey (
              id,
              name,
              location,
              device_location
            )
          ''')
          .eq('employee_id', int.parse(currentUser.id))
          .gte('access_time', startOfDay.toIso8601String())
          .lt('access_time', endOfDay.toIso8601String())
          .order('access_time', ascending: true);

      response = (cardReadings as List).map((record) {
        // Devices tablosundan kapı bilgisini al
        final device = record['devices'];
        final doorName = device != null 
            ? '${device['name']} (${device['device_location'] ?? device['location']})'
            : record['device_location'] ?? 'Bilinmeyen Kapı';
            
        return {
          'id': record['id'],
          'user_id': record['employee_id']?.toString(),
          'employee_id': record['employee_id'],
          'type': record['raw_data'] == 'check_in' ? 'check_in' : 'check_out',
          'created_at': record['access_time'],
          'access_time': record['access_time'],
          'door_name': doorName,
          'device_location': record['device_location'],
          'employee_name': record['employee_name'],
          'status': record['status'],
        };
      }).toList();
    } else {
      // Adminler için direkt veritabanı sorgusu
      response = await supabase
          .from('pdks_records')
          .select()
          .gte('date', startOfDay.toIso8601String().split('T')[0])
          .lt('date', endOfDay.toIso8601String().split('T')[0])
          .order('entry_time', ascending: true);
    }

    final todayRecords = (response as List)
        .map((record) => Attendance.fromJson(record))
        .toList();

    if (todayRecords.isNotEmpty) {
      final checkIn = todayRecords.firstWhere(
        (record) => record.type == 'check_in',
        orElse: () => Attendance(
          id: '',
          userId: currentUser.id,
          type: 'check_in',
          timestamp: DateTime.now(),
          doorName: '',
        ),
      );

      final checkOut = todayRecords.firstWhere(
        (record) => record.type == 'check_out',
        orElse: () => Attendance(
          id: '',
          userId: currentUser.id,
          type: 'check_out',
          timestamp: DateTime.now(),
          doorName: '',
        ),
      );

      _todayAttendance = Attendance(
        id: checkIn.id,
        userId: currentUser.id,
        type: 'check_in',
        timestamp: checkIn.timestamp,
        doorName: checkIn.doorName,
        checkInTime: checkIn.type == 'check_in' ? checkIn.timestamp : null,
        checkOutTime: checkOut.type == 'check_out' ? checkOut.timestamp : null,
      );
    } else {
      _todayAttendance = null;
    }
  }

  Future<bool> recordAttendance(String qrData, String type) async {
    try {
      _isLoading = true;
      notifyListeners();

      final currentUser = _authProvider?.currentUser;
      if (currentUser == null) return false;

      // Çalışanlar için card_readings tablosuna kaydet
      if (currentUser.userType == UserType.employee) {
        final response = await supabase.from('card_readings').insert({
          'card_no': qrData,
          'status': 'authorized',
          'access_granted': true,
          'employee_id': int.parse(currentUser.id),
          'employee_name': '${currentUser.firstName} ${currentUser.lastName}',
          'device_id': 1, // Ana Giriş QR Okuyucu
          'device_name': 'Mobile App',
          'device_location': 'Ana Giriş',
          'raw_data': type,
        }).select();

        if (response.isNotEmpty) {
          await loadAttendanceRecords();
          _isLoading = false;
          notifyListeners();
          return true;
        }
      } else {
        // Adminler için card_readings tablosuna kaydet
        final response = await supabase.from('card_readings').insert({
          'card_no': qrData,
          'status': 'authorized',
          'access_granted': true,
          'employee_name': '${currentUser.firstName} ${currentUser.lastName}',
          'device_name': 'Mobile App',
          'device_location': 'Main Entrance',
        }).select();

        if (response.isNotEmpty) {
          await loadAttendanceRecords();
          _isLoading = false;
          notifyListeners();
          return true;
        }
      }

      _isLoading = false;
      notifyListeners();
      return false;
    } catch (error) {
      _isLoading = false;
      _errorMessage = error.toString();
      notifyListeners();
      return false;
    }
  }

  // İstatistikler için yardımcı metodlar
  int get totalDaysThisMonth {
    final now = DateTime.now();
    final lastDayOfMonth = DateTime(now.year, now.month + 1, 0);
    
    return lastDayOfMonth.day;
  }

  int get daysPresent {
    final now = DateTime.now();
    final firstDayOfMonth = DateTime(now.year, now.month, 1);
    
    return _attendanceRecords
        .where((record) => 
            record.type == 'check_in' && 
            record.timestamp.isAfter(firstDayOfMonth) &&
            record.timestamp.isBefore(now))
        .length;
  }

  int get timesLate {
    // 09:00'dan sonra gelen kayıtları geç sayıyoruz
    const lateTime = Duration(hours: 9);
    
    return _attendanceRecords
        .where((record) => 
            record.type == 'check_in' && 
            Duration(hours: record.timestamp.hour, minutes: record.timestamp.minute) > lateTime)
        .length;
  }



  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
} 