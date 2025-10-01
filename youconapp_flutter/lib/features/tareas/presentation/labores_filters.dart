import 'package:flutter_riverpod/flutter_riverpod.dart';

class DateRangeFilter {
  final String? fromISO;
  final String? toISO;
  const DateRangeFilter({this.fromISO, this.toISO});

  bool get hasFilter => fromISO != null || toISO != null;
}

final laboresDateRangeProvider =
    StateProvider<DateRangeFilter>((_) => const DateRangeFilter());
