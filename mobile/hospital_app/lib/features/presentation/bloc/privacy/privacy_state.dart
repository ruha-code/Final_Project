part of 'privacy_bloc.dart';

@immutable
class PrivacyState {
  final Map<String, bool> toggles;

  const PrivacyState({required this.toggles});

  factory PrivacyState.initial() => const PrivacyState(
        toggles: {
          'online': true,
          'readReceipts': true,
          'analytics': false,
          'location': true,
        },
      );

  bool valueOf(String key) => toggles[key] ?? false;
}
