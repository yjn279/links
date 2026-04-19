class AppConfig {
  static const backendUrl = String.fromEnvironment(
    'LINKS_BACKEND_URL',
    defaultValue: '',
  );
  static const backendToken = String.fromEnvironment(
    'LINKS_BACKEND_TOKEN',
    defaultValue: '',
  );
}
