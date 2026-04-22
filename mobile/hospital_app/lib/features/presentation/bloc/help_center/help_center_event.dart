part of 'help_center_bloc.dart';

@immutable
sealed class HelpCenterEvent {}

final class HelpCenterFaqToggled extends HelpCenterEvent {
  final int index;
  HelpCenterFaqToggled(this.index);
}
