import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

/// Локальные уведомления — версия для flutter_local_notifications 21.x.
///
/// В 21.x ВСЕ методы перевели на именованные параметры:
///   initialize(settings: ...)
///   show(id: ..., title: ..., body: ..., notificationDetails: ...)
///   zonedSchedule(id: ..., title: ..., body: ..., scheduledDate: ...,
///                 notificationDetails: ..., androidScheduleMode: ...)
///   cancel(id: ...)
///
/// Параметра `uiLocalNotificationDateInterpretation` больше нет.
class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;

    tz_data.initializeTimeZones();

    const androidInit =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const initSettings = InitializationSettings(
      android: androidInit,
      iOS: iosInit,
    );
    await _plugin.initialize(settings: initSettings);

    // Android 13+: запрашиваем permission на нотификации.
    final android = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await android?.requestNotificationsPermission();

    _initialized = true;
  }

  Future<bool> _isEnabled(String? uid) async {
    if (uid == null) return false;
    try {
      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(uid)
          .get();
      final v = doc.data()?['notificationsEnabled'] as bool?;
      return v ?? true;
    } catch (_) {
      return true;
    }
  }

  static const _details = NotificationDetails(
    android: AndroidNotificationDetails(
      'medlink',
      'Medlink',
      channelDescription: 'Appointments and reminders',
      importance: Importance.high,
      priority: Priority.high,
    ),
    iOS: DarwinNotificationDetails(),
  );

  Future<void> showBookingConfirmed({
    required String? uid,
    required String doctorName,
    required DateTime when,
  }) async {
    await init();
    if (!await _isEnabled(uid)) return;

    final hh = when.hour.toString().padLeft(2, '0');
    final mm = when.minute.toString().padLeft(2, '0');
    final id = DateTime.now().millisecondsSinceEpoch.remainder(1 << 31);

    await _plugin.show(
      id: id,
      title: 'Appointment booked',
      body: 'With $doctorName at $hh:$mm',
      notificationDetails: _details,
    );
  }

  Future<int?> scheduleAppointmentReminder({
    required String? uid,
    required String appointmentId,
    required String doctorName,
    required DateTime startsAt,
  }) async {
    await init();
    if (!await _isEnabled(uid)) return null;

    final fire = startsAt.subtract(const Duration(minutes: 30));
    if (fire.isBefore(DateTime.now())) return null;

    final id = appointmentId.hashCode & 0x7FFFFFFF;
    final hh = startsAt.hour.toString().padLeft(2, '0');
    final mm = startsAt.minute.toString().padLeft(2, '0');

    try {
      await _plugin.zonedSchedule(
        id: id,
        title: 'Upcoming appointment',
        body: '$doctorName at $hh:$mm — in 30 minutes',
        scheduledDate: tz.TZDateTime.from(fire, tz.local),
        notificationDetails: _details,
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      );
      return id;
    } catch (_) {
      return null;
    }
  }

  Future<void> cancelScheduledForAppointment(String appointmentId) async {
    await init();
    final id = appointmentId.hashCode & 0x7FFFFFFF;
    try {
      await _plugin.cancel(id: id);
    } catch (_) {}
  }

  Future<void> showStatusUpdate({
    required String? uid,
    required String doctorName,
    required String newStatus,
  }) async {
    await init();
    if (!await _isEnabled(uid)) return;

    final id = DateTime.now().millisecondsSinceEpoch.remainder(1 << 31);
    await _plugin.show(
      id: id,
      title: 'Appointment $newStatus',
      body: 'With $doctorName',
      notificationDetails: _details,
    );
  }
}