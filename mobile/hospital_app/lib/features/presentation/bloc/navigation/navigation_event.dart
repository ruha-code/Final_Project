part of 'navigation_bloc.dart';

@immutable
sealed class NavigationEvent {}

final class NavigationTabChanged extends NavigationEvent {
  final int index;
  NavigationTabChanged(this.index);
}
