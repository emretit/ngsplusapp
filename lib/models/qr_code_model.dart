import 'dart:convert';
import 'dart:math';

class QRCodeModel {
  final String id;
  final int deviceId;
  final String deviceName;
  final String location;
  final DateTime createdAt;
  final bool isActive;
  final String qrData;

  QRCodeModel({
    required this.id,
    required this.deviceId,
    required this.deviceName,
    required this.location,
    required this.createdAt,
    required this.isActive,
    required this.qrData,
  });

  factory QRCodeModel.fromJson(Map<String, dynamic> json) {
    return QRCodeModel(
      id: json['id']?.toString() ?? '',
      deviceId: json['device_id'] ?? 0,
      deviceName: json['device_name'] ?? '',
      location: json['location'] ?? '',
      createdAt: DateTime.parse(json['created_at']),
      isActive: json['is_active'] ?? true,
      qrData: json['qr_data'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'device_id': deviceId,
      'device_name': deviceName,
      'location': location,
      'created_at': createdAt.toIso8601String(),
      'is_active': isActive,
      'qr_data': qrData,
    };
  }
}

class QRCodeGenerator {
  static String generateQRData({
    required int deviceId,
    required String location,
    required String deviceName,
    String? additionalData,
  }) {
    final data = {
      'device_id': deviceId,
      'location': location,
      'device_name': deviceName,
      'timestamp': DateTime.now().toIso8601String(),
      if (additionalData != null) 'additional_data': additionalData,
    };

    return base64Encode(utf8.encode(jsonEncode(data)));
  }

  static Map<String, dynamic> parseQRData(String qrData) {
    try {
      final decodedData = utf8.decode(base64Decode(qrData));
      final data = jsonDecode(decodedData) as Map<String, dynamic>;

      // Zorunlu alanları kontrol et
      if (!data.containsKey('device_id') || 
          !data.containsKey('location') || 
          !data.containsKey('device_name')) {
        return {
          'is_valid': false,
          'error': 'QR kod eksik bilgi içeriyor',
        };
      }

      // Timestamp kontrolü
      if (data.containsKey('timestamp')) {
        final timestamp = DateTime.parse(data['timestamp']);
        final now = DateTime.now();
        
        // 24 saatten eski QR kodları geçersiz say
        if (now.difference(timestamp).inHours > 24) {
          return {
            'is_valid': false,
            'error': 'QR kod süresi dolmuş',
          };
        }
      }

      return {
        'is_valid': true,
        'device_id': data['device_id'],
        'location': data['location'],
        'device_name': data['device_name'],
        'timestamp': data['timestamp'],
        'additional_data': data['additional_data'],
      };
    } catch (e) {
      return {
        'is_valid': false,
        'error': 'QR kod formatı geçersiz',
      };
    }
  }

  static bool isValidQRData(String qrData) {
    final parsedData = parseQRData(qrData);
    return parsedData['is_valid'] as bool;
  }
} 