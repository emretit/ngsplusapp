class Attendance {
  final String id;
  final String userId;
  final String type; // 'check_in' or 'check_out'
  final DateTime timestamp;
  final String doorName;
  final DateTime? checkInTime;
  final DateTime? checkOutTime;
  final String? employeeName;
  final String? status;

  Attendance({
    required this.id,
    required this.userId,
    required this.type,
    required this.timestamp,
    required this.doorName,
    this.checkInTime,
    this.checkOutTime,
    this.employeeName,
    this.status,
  });

  // UTC tarihini Türkiye saatine çeviren yardımcı metod
  static DateTime _parseToTurkeyTime(String dateTimeString) {
    final utcDateTime = DateTime.parse(dateTimeString);
    // UTC+3 (Türkiye saati) için 3 saat ekle
    return utcDateTime.add(const Duration(hours: 3));
  }

  factory Attendance.fromJson(Map<String, dynamic> json) {
    // PDKS records için
    if (json.containsKey('date') && json.containsKey('entry_time')) {
      final date = json['date'] != null ? DateTime.parse(json['date']) : DateTime.now();
      final entryTime = json['entry_time'];
      final exitTime = json['exit_time'];
      
      DateTime? checkInDateTime;
      DateTime? checkOutDateTime;
      
      if (entryTime != null) {
        final timeParts = entryTime.split(':');
        checkInDateTime = DateTime(
          date.year, 
          date.month, 
          date.day,
          int.parse(timeParts[0]),
          int.parse(timeParts[1]),
          timeParts.length > 2 ? int.parse(timeParts[2]) : 0,
        );
      }
      
      if (exitTime != null) {
        final timeParts = exitTime.split(':');
        checkOutDateTime = DateTime(
          date.year, 
          date.month, 
          date.day,
          int.parse(timeParts[0]),
          int.parse(timeParts[1]),
          timeParts.length > 2 ? int.parse(timeParts[2]) : 0,
        );
      }
      
      return Attendance(
        id: json['id']?.toString() ?? '',
        userId: json['employee_id']?.toString() ?? '',
        type: entryTime != null ? 'check_in' : 'check_out',
        timestamp: checkInDateTime ?? checkOutDateTime ?? date,
        doorName: 'Main Entrance',
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        employeeName: '${json['employee_first_name'] ?? ''} ${json['employee_last_name'] ?? ''}',
        status: json['status'],
      );
    }
    
    // Card readings için (employee-records fonksiyonundan gelen format)
    final timestampString = json['created_at'] ?? json['access_time'] ?? DateTime.now().toIso8601String();
    final turkeyTimestamp = _parseToTurkeyTime(timestampString);
    
    return Attendance(
      id: json['id']?.toString() ?? '',
      userId: json['user_id'] ?? json['employee_id']?.toString() ?? '',
      type: json['type'] ?? 'check_in',
      timestamp: turkeyTimestamp,
      doorName: json['door_name'] ?? json['device_location'] ?? 'Ana Giriş',
      checkInTime: json['check_in_time'] != null 
          ? _parseToTurkeyTime(json['check_in_time']) 
          : null,
      checkOutTime: json['check_out_time'] != null 
          ? _parseToTurkeyTime(json['check_out_time']) 
          : null,
      employeeName: json['employee_name'],
      status: json['status'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'type': type,
      'created_at': timestamp.toIso8601String(),
      'door_name': doorName,
      'check_in_time': checkInTime?.toIso8601String(),
      'check_out_time': checkOutTime?.toIso8601String(),
      'employee_name': employeeName,
      'status': status,
    };
  }
} 