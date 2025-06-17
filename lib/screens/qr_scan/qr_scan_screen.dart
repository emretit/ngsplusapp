import 'package:flutter/material.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'package:provider/provider.dart';
import '../../providers/attendance_provider.dart';
import '../../models/qr_code_model.dart';
import 'dart:io';

class QRScanScreen extends StatefulWidget {
  const QRScanScreen({Key? key}) : super(key: key);

  @override
  State<QRScanScreen> createState() => _QRScanScreenState();
}

class _QRScanScreenState extends State<QRScanScreen> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;
  bool _isProcessing = false;
  String? _lastScannedCode;
  DateTime? _lastScanTime;

  @override
  void reassemble() {
    super.reassemble();
    if (Platform.isAndroid) {
      controller?.pauseCamera();
    } else if (Platform.isIOS) {
      controller?.resumeCamera();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('QR Kod Tara'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flip_camera_android),
            onPressed: () async {
              await controller?.flipCamera();
            },
          ),
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () async {
              await controller?.toggleFlash();
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          QRView(
            key: qrKey,
            onQRViewCreated: _onQRViewCreated,
            overlay: QrScannerOverlayShape(
              borderColor: Theme.of(context).primaryColor,
              borderRadius: 10,
              borderLength: 30,
              borderWidth: 10,
              cutOutSize: MediaQuery.of(context).size.width * 0.8,
            ),
          ),
          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
        ],
      ),
    );
  }

  void _onQRViewCreated(QRViewController controller) {
    this.controller = controller;
    controller.scannedDataStream.listen((scanData) async {
      if (_isProcessing) return;
      
      final now = DateTime.now();
      if (_lastScannedCode == scanData.code && 
          _lastScanTime != null &&
          now.difference(_lastScanTime!).inSeconds < 3) {
        return; // Aynı QR kodu 3 saniye içinde tekrar taramayı engelle
      }

      _lastScannedCode = scanData.code;
      _lastScanTime = now;

      if (scanData.code != null) {
        await _processQRCode(scanData.code!);
      }
    });
  }

  Future<void> _processQRCode(String qrData) async {
    setState(() => _isProcessing = true);

    try {
      // QR kod verisini doğrula
      final parsedData = QRCodeGenerator.parseQRData(qrData);
      if (!parsedData['is_valid']) {
        _showErrorDialog(parsedData['error'] ?? 'Geçersiz QR kod');
        return;
      }

      final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
      
      // Giriş/çıkış durumunu belirle
      final type = attendanceProvider.hasCheckedInToday 
          ? (attendanceProvider.hasCheckedOutToday ? 'check_in' : 'check_out')
          : 'check_in';

      // QR kod verisini kaydet
      final success = await attendanceProvider.recordAttendance(
        qrData,
        type,
        deviceId: parsedData['device_id'],
        location: parsedData['location'],
      );

      if (success) {
        _showSuccessDialog(
          type == 'check_in' ? 'Giriş Başarılı' : 'Çıkış Başarılı',
          parsedData,
        );
      } else {
        _showErrorDialog(attendanceProvider.errorMessage ?? 'Bir hata oluştu');
      }
    } catch (e) {
      _showErrorDialog('QR kod işlenirken bir hata oluştu: $e');
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  void _showSuccessDialog(String message, Map<String, dynamic> deviceInfo) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Başarılı'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message),
            const SizedBox(height: 8),
            Text('Cihaz: ${deviceInfo['device_name']}'),
            Text('Konum: ${deviceInfo['location']}'),
            if (deviceInfo['timestamp'] != null)
              Text('Zaman: ${DateTime.parse(deviceInfo['timestamp']).toString()}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Tamam'),
          ),
        ],
      ),
    );
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hata'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Tamam'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }
} 