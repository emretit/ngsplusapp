import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/attendance_provider.dart';
import '../../theme/app_theme.dart';
import '../../models/attendance.dart';
import '../../models/qr_code_model.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  DateTime? _selectedDate;
  String? _selectedDevice;
  List<String> _deviceList = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    try {
      final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
      await attendanceProvider.loadAttendanceRecords();
      
      // Benzersiz cihaz listesini oluştur
      final devices = attendanceProvider.attendanceRecords
          .where((record) => record.deviceInfo != null)
          .map((record) => record.formattedDeviceInfo)
          .toSet()
          .toList();
      
      setState(() {
        _deviceList = devices;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Veriler yüklenirken hata oluştu: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Geçmiş'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterDialog,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Consumer<AttendanceProvider>(
              builder: (context, attendanceProvider, child) {
                if (attendanceProvider.errorMessage != null) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red[300],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Hata',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 8),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 32),
                          child: Text(
                            attendanceProvider.errorMessage!,
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: _loadData,
                          child: const Text('Tekrar Dene'),
                        ),
                      ],
                    ),
                  );
                }
                
                return Column(
              children: [
                // Filtre çipleri
                if (_selectedDate != null || _selectedDevice != null)
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Wrap(
                      spacing: 8,
                      children: [
                        if (_selectedDate != null)
                          Chip(
                            label: Text(
                              DateFormat('dd.MM.yyyy').format(_selectedDate!),
                            ),
                            onDeleted: () {
                              setState(() => _selectedDate = null);
                            },
                          ),
                        if (_selectedDevice != null)
                          Chip(
                            label: Text(_selectedDevice!),
                            onDeleted: () {
                              setState(() => _selectedDevice = null);
                            },
                          ),
                      ],
                    ),
                  ),
                // Kayıt listesi
                Expanded(
                  child: Consumer<AttendanceProvider>(
                    builder: (context, provider, child) {
                      final records = _getFilteredRecords();
                      
                      if (records.isEmpty) {
                        return RefreshIndicator(
                          onRefresh: _loadData,
                          child: const Center(
                            child: Text('Kayıt bulunamadı'),
                          ),
                        );
                      }

                      return RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          itemCount: records.length,
                          itemBuilder: (context, index) {
                            final record = records[index];
                            return _buildAttendanceCard(record);
                          },
                        ),
                      );
                    },
                  ),
                ),
              ],
            );
              },
            ),
    );
  }

  List<Attendance> _getFilteredRecords() {
    final attendanceProvider = Provider.of<AttendanceProvider>(context);
    var records = attendanceProvider.attendanceRecords;

    if (_selectedDate != null) {
      final startOfDay = DateTime(
        _selectedDate!.year,
        _selectedDate!.month,
        _selectedDate!.day,
      );
      final endOfDay = startOfDay.add(const Duration(days: 1));

      records = records.where((record) {
        return record.timestamp.isAfter(startOfDay) && 
               record.timestamp.isBefore(endOfDay);
      }).toList();
    }

    if (_selectedDevice != null) {
      records = records.where((record) {
        return record.formattedDeviceInfo == _selectedDevice;
      }).toList();
    }

    return records;
  }

  Widget _buildAttendanceCard(Attendance record) {
    final isCheckIn = record.type == 'check_in';
    final formattedTime = DateFormat('HH:mm').format(record.timestamp);
    final formattedDate = DateFormat('dd.MM.yyyy').format(record.timestamp);
    final deviceInfoText = record.formattedDeviceInfo;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Sol taraf - İkon
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: isCheckIn ? Colors.green : Colors.red,
                borderRadius: BorderRadius.circular(25),
              ),
              child: Icon(
                isCheckIn ? Icons.login : Icons.logout,
                color: Colors.white,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            
            // Orta kısım - Ana bilgiler
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Giriş/Çıkış başlığı
                  Text(
                    isCheckIn ? 'Giriş' : 'Çıkış',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  
                  // Cihaz ismi ve konumu
                  Text(
                    deviceInfoText,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  
                  // Tarih ve saat
                  Text(
                    '$formattedDate $formattedTime',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
            
            // Sağ taraf - Detay butonu
            IconButton(
              icon: const Icon(Icons.info_outline),
              onPressed: () => _showRecordDetails(record),
            ),
          ],
        ),
      ),
    );
  }

  void _showRecordDetails(Attendance record) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(record.type == 'check_in' ? 'Giriş Detayları' : 'Çıkış Detayları'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Tarih: ${DateFormat('dd.MM.yyyy').format(record.timestamp)}'),
            Text('Saat: ${DateFormat('HH:mm:ss').format(record.timestamp)}'),
            if (record.deviceInfo != null) ...[
              const SizedBox(height: 8),
              const Text('Cihaz Bilgileri:'),
              Text('Cihaz: ${record.deviceInfo!['device_name']}'),
              Text('Konum: ${record.deviceInfo!['location']}'),
              if (record.deviceInfo!['timestamp'] != null)
                Text('Oluşturulma: ${DateTime.parse(record.deviceInfo!['timestamp']).toString()}'),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Kapat'),
          ),
        ],
      ),
    );
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filtrele'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Tarih seçici
            ListTile(
              title: const Text('Tarih'),
              subtitle: Text(
                _selectedDate != null
                    ? DateFormat('dd.MM.yyyy').format(_selectedDate!)
                    : 'Tarih seçilmedi',
              ),
              trailing: const Icon(Icons.calendar_today),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _selectedDate ?? DateTime.now(),
                  firstDate: DateTime(2020),
                  lastDate: DateTime.now(),
                );
                if (date != null) {
                  setState(() => _selectedDate = date);
                }
                Navigator.pop(context);
              },
            ),
            // Cihaz seçici
            if (_deviceList.isNotEmpty)
              ListTile(
                title: const Text('Cihaz'),
                subtitle: Text(_selectedDevice ?? 'Cihaz seçilmedi'),
                trailing: const Icon(Icons.devices),
                onTap: () {
                  Navigator.pop(context);
                  _showDeviceSelectionDialog();
                },
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _selectedDate = null;
                _selectedDevice = null;
              });
              Navigator.pop(context);
            },
            child: const Text('Filtreleri Temizle'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Tamam'),
          ),
        ],
      ),
    );
  }

  void _showDeviceSelectionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cihaz Seç'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: _deviceList.length,
            itemBuilder: (context, index) {
              final device = _deviceList[index];
              return ListTile(
                title: Text(device),
                selected: device == _selectedDevice,
                onTap: () {
                  setState(() => _selectedDevice = device);
                  Navigator.pop(context);
                },
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
        ],
      ),
    );
  }
} 