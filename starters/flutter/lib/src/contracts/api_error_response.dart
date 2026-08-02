// GENERATED FROM contracts/schemas/api-error-response.v1.schema.json. DO NOT EDIT.
// schema-sha256: a3d0ff5ddb530f42843cc4f6d88b994d104d3a677aa99a5c35695fc37414b15c
final class ApiErrorResponse {
  const ApiErrorResponse({
    required this.success,
    required this.statusCode,
    required this.errorCode,
    required this.message,
    required this.details,
    required this.path,
    required this.timestamp,
    required this.requestId,
  });

  static ApiErrorResponse? tryParse(Object? value) {
    if (value case {
      'success': false,
      'statusCode': final int statusCode,
      'errorCode': final String errorCode,
      'message': final String message,
      'path': final String path,
      'timestamp': final String timestamp,
    }) {
      final parsedTimestamp = DateTime.tryParse(timestamp);
      if (parsedTimestamp != null) {
        final map = value as Map<String, Object?>;
        return ApiErrorResponse(
          success: false,
          statusCode: statusCode,
          errorCode: errorCode,
          message: message,
          details: map['details'],
          path: path,
          timestamp: parsedTimestamp.toUtc(),
          requestId: map['requestId'] is String ? map['requestId']! as String : null,
        );
      }
    }
    return null;
  }

  final bool success;
  final int statusCode;
  final String errorCode;
  final String message;
  final Object? details;
  final String path;
  final DateTime timestamp;
  final String? requestId;
}
