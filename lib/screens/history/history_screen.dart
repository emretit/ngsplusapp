import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/attendance_provider.dart';
import '../../theme/app_theme.dart';
import '../../models/attendance.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  DateTime? _startDate;
  DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final attendanceProvider = Provider.of<AttendanceProvider>(context, listen: false);
    await attendanceProvider.loadAttendanceRecords();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : Colors.grey[50],
      appBar: AppBar(
        title: const Text('Yoklama Geçmişi'),
        backgroundColor: Colors.transparent,
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showDateFilterDialog,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: Column(
          children: [
            if (_startDate != null || _endDate != null) _buildFilterChip(),
            Expanded(
              child: Consumer<AttendanceProvider>(
                builder: (context, attendanceProvider, _) {
                  if (attendanceProvider.isLoading) {
                    return const Center(
                      child: CircularProgressIndicator(),
                    );
                  }

                  final filteredRecords = _getFilteredRecords(
                    attendanceProvider.attendanceRecords,
                  );

                  if (filteredRecords.isEmpty) {
                    return _buildEmptyState();
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredRecords.length,
                    itemBuilder: (context, index) {
                      final record = filteredRecords[index];
                      return _buildAttendanceCard(record);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip() {
    return Container(
      margin: const EdgeInsets.all(16),
      child: Wrap(
        spacing: 8,
        children: [
          if (_startDate != null || _endDate != null)
            FilterChip(
              label: Text(_getFilterText()),
              onSelected: (_) {},
              deleteIcon: const Icon(Icons.close, size: 18),
              onDeleted: () {
                setState(() {
                  _startDate = null;
                  _endDate = null;
                });
              },
              backgroundColor: AppTheme.primaryBurgundy.withValues(alpha: 0.1),
              labelStyle: TextStyle(
                color: Theme.of(context).brightness == Brightness.dark
                    ? AppTheme.primaryBurgundy2
                    : AppTheme.primaryBurgundy,
              ),
            ),
        ],
      ),
    );
  }

  String _getFilterText() {
    if (_startDate != null && _endDate != null) {
      return '${DateFormat('dd/MM/yyyy').format(_startDate!)} - ${DateFormat('dd/MM/yyyy').format(_endDate!)}';
    } else if (_startDate != null) {
      return '${DateFormat('dd/MM/yyyy').format(_startDate!)} itibaren';
    } else if (_endDate != null) {
      return '${DateFormat('dd/MM/yyyy').format(_endDate!)} tarihine kadar';
    }
    return '';
  }

  List<Attendance> _getFilteredRecords(List<Attendance> records) {
    return records.where((record) {
      if (_startDate != null && record.timestamp.isBefore(_startDate!)) {
        return false;
      }
      if (_endDate != null && record.timestamp.isAfter(_endDate!.add(const Duration(days: 1)))) {
        return false;
      }
      return true;
    }).toList();
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.history,
            size: 80,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'Henüz yoklama kaydı yok',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'İlk yoklamanızı almak için QR kod tarayın',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceCard(Attendance record) {
    final isCheckIn = record.type == 'check_in';
    final color = isCheckIn ? Colors.green : Colors.red;
    final icon = isCheckIn ? Icons.login : Icons.logout;
    final typeText = isCheckIn ? 'Giriş' : 'Çıkış';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: color,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        typeText,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: color,
                        ),
                      ),
                      Text(
                        DateFormat('HH:mm').format(record.timestamp),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        record.doorName.isNotEmpty ? record.doorName : 'Ana Giriş',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        DateFormat('dd/MM/yyyy').format(record.timestamp),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDateFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Tarih Filtresi'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('Başlangıç Tarihi'),
              subtitle: Text(
                _startDate != null
                    ? DateFormat('dd/MM/yyyy').format(_startDate!)
                    : 'Seçilmedi',
              ),
              trailing: const Icon(Icons.calendar_today),
              onTap: () => _selectStartDate(),
            ),
            ListTile(
              title: const Text('Bitiş Tarihi'),
              subtitle: Text(
                _endDate != null
                    ? DateFormat('dd/MM/yyyy').format(_endDate!)
                    : 'Seçilmedi',
              ),
              trailing: const Icon(Icons.calendar_today),
              onTap: () => _selectEndDate(),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _startDate = null;
                _endDate = null;
              });
              Navigator.pop(context);
            },
            child: const Text('Temizle'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Kapat'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {});
            },
            child: const Text('Uygula'),
          ),
        ],
      ),
    );
  }

  Future<void> _selectStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _startDate = picked;
      });
    }
  }

  Future<void> _selectEndDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _endDate ?? DateTime.now(),
      firstDate: _startDate ?? DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _endDate = picked;
      });
    }
  }
} 