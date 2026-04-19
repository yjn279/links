import 'package:drift/native.dart';
import 'package:links/core/database/app_database.dart';

AppDatabase buildTestDatabase() => AppDatabase(NativeDatabase.memory());
