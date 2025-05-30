import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/attendance_provider.dart';
import '../../theme/app_theme.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';

class QRScanScreen extends StatefulWidget {
  const QRScanScreen({super.key});

  @override
  State<QRScanScreen> createState() => _QRScanScreenState();
}

class _QRScanScreenState extends State<QRScanScreen> {
  bool _isScanning = false;
  bool _flashOn = false;
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;
  bool _scanned = false;

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }

  @override
  void reassemble() {
    super.reassemble();
    if (controller != null) {
      controller!.pauseCamera();
      controller!.resumeCamera();
    }
  }

  void _onQRViewCreated(QRViewController ctrl) {
    controller = ctrl;
    controller?.scannedDataStream.listen((scanData) async {
      if (_scanned || !mounted) return;
      
      setState(() {
        _scanned = true;
        _isScanning = true;
      });
      
      // QR kod tarandığında kamerayı duraklat
      await controller?.pauseCamera();
      
      final qrData = scanData.code;
      final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
      final hasCheckedIn = attendanceProvider.hasCheckedInToday;
      final type = hasCheckedIn ? 'check_out' : 'check_in';
      final success = await attendanceProvider.recordAttendance(qrData ?? '', type);
      
      if (mounted) {
        setState(() {
          _isScanning = false;
        });
        
        if (success) {
          _showSuccessDialog(type);
        } else {
          setState(() {
            _scanned = false;
          });
          
          final errorMessage = attendanceProvider.errorMessage;
          if (errorMessage != null && errorMessage.isNotEmpty) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(errorMessage)),
            );
          }
          _showErrorDialog();
          
          // Hata durumunda kamerayı tekrar başlat
          await Future.delayed(const Duration(milliseconds: 500));
          if (mounted && controller != null) {
            await controller?.resumeCamera();
          }
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text('QR Kod Tara'),
        actions: [
          IconButton(
            icon: Icon(_flashOn ? Icons.flash_on : Icons.flash_off),
            onPressed: () async {
              if (controller != null) {
                setState(() {
                  _flashOn = !_flashOn;
                });
                await controller?.toggleFlash();
              }
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          if (!_scanned || _isScanning)
            QRView(
              key: qrKey,
              onQRViewCreated: _onQRViewCreated,
              overlay: QrScannerOverlayShape(
                borderColor: isDark ? AppTheme.primaryBurgundy2 : AppTheme.primaryBurgundy,
                borderRadius: 12,
                borderLength: 30,
                borderWidth: 8,
                cutOutSize: 250,
              ),
            ),
          if (_scanned && !_isScanning)
            Container(
              color: Colors.black,
              child: const Center(
                child: Text(
                  'QR kod işleniyor...',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          if (_isScanning)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            ),
          if (!_scanned || _isScanning)
            Positioned(
              bottom: 120,
              left: 20,
              right: 20,
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'QR kodu kare içerisine hizalayın',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _showSuccessDialog(String type) {
    final message = type == 'check_in' 
        ? 'Giriş kaydınız başarıyla alındı!'
        : 'Çıkış kaydınız başarıyla alındı!';
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        icon: const Icon(
          Icons.check_circle,
          color: Colors.green,
          size: 48,
        ),
        title: const Text('Başarılı'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop(); // Close dialog
              // Ana sayfaya yönlendir (tüm stack'i temizle)
              Navigator.of(context).pushNamedAndRemoveUntil(
                '/home',
                (route) => false,
              );
            },
            child: const Text('Tamam'),
          ),
        ],
      ),
    );
  }

  void _showErrorDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        icon: const Icon(
          Icons.error,
          color: Colors.red,
          size: 48,
        ),
        title: const Text('Hata'),
        content: const Text('Erişim reddedildi. Lütfen tekrar deneyin.'),
        actions: [
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              // Dialog kapandıktan sonra kamerayı yeniden başlat
              await Future.delayed(const Duration(milliseconds: 300));
              if (mounted && controller != null) {
                setState(() {
                  _scanned = false;
                });
                await controller?.resumeCamera();
              }
            },
            child: const Text('Tamam'),
          ),
        ],
      ),
    );
  }
} 