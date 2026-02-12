#!/bin/bash

# Script que genera logs de prueba continuamente en el backend
while true; do
  TIMESTAMP=$(date -u +'%Y-%m-%dT%H:%M:%S.%3NZ')
  
  # Simulamos diferentes tipos de logs
  case $((RANDOM % 10)) in
    0)
      echo "$TIMESTAMP [ERROR] POST /api/auth/login - 401 Unauthorized - Invalid credentials - email=test@example.com"
      ;;
    1)
      echo "$TIMESTAMP [WARNING] Slow query detected - Query took 2.5s - SELECT * FROM users WHERE email='test@example.com'"
      ;;
    2)
      echo "$TIMESTAMP [INFO] GET /api/seeds - 200 OK - user_id=2 - response_time=45ms"
      ;;
    3)
      echo "$TIMESTAMP [INFO] POST /api/auth/login - 200 OK - Login exitoso - usuario_id=2 email=test@example.com"
      ;;
    4)
      echo "$TIMESTAMP [INFO] JWT token generado - expires=1771490721 - token_type=bearer"
      ;;
    5)
      echo "$TIMESTAMP [DEBUG] Database connection pool size: 5/10"
      ;;
    6)
      echo "$TIMESTAMP [INFO] GET /api/users/me - 200 OK - Response time 12ms"
      ;;
    7)
      echo "$TIMESTAMP [WARNING] Cache miss for seed_category_123 - Fallback to database query"
      ;;
    8)
      echo "$TIMESTAMP [ERROR] Connection timeout to Google Cloud Vision API - retrying..."
      ;;
    *)
      echo "$TIMESTAMP [INFO] Health check passed - All systems operational"
      ;;
  esac
  
  sleep 3
done
