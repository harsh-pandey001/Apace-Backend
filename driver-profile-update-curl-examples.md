# Driver Profile Update API - Curl Examples

## 🔑 Step 1: Login to get JWT token

```bash
curl -X POST http://localhost:5000/api/driver-auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "8989120990",
    "otp": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully", 
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "driver",
  "driver": {
    "id": "driver-uuid",
    "name": "Current Name"
  }
}
```

## 🔧 Step 2: Update Driver Profile

### Update Single Field (Name)

```bash
curl -X PATCH http://localhost:5000/api/drivers/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Driver Name"
  }'
```

### Update Multiple Fields

```bash
curl -X PATCH http://localhost:5000/api/drivers/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john.smith@example.com",
    "vehicleType": "car",
    "vehicleCapacity": "4 passengers"
  }'
```

### Update Vehicle Number (with validation)

```bash
curl -X PATCH http://localhost:5000/api/drivers/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleNumber": "MH09 AB1234"
  }'
```

### Update Email

```bash
curl -X PATCH http://localhost:5000/api/drivers/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com"
  }'
```

### Update Vehicle Information

```bash
curl -X PATCH http://localhost:5000/api/drivers/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleType": "van",
    "vehicleCapacity": "8 passengers",
    "vehicleNumber": "KA12 CD5678"
  }'
```

## ✅ Success Response

```json
{
  "status": "success",
  "message": "Driver profile updated successfully",
  "data": {
    "driver": {
      "id": "driver-uuid",
      "name": "Updated Driver Name",
      "email": "updated@example.com",
      "phone": "+1234567890",
      "vehicleType": "car",
      "vehicleCapacity": "4 passengers", 
      "vehicleNumber": "MH09 AB1234",
      "availability_status": "available",
      "isActive": true,
      "isVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

## ❌ Error Examples

### Invalid Vehicle Number Format

```bash
curl -X PATCH http://localhost:5000/api/drivers/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleNumber": "INVALID123"
  }'
```

**Response (400):**
```json
{
  "status": "fail",
  "message": "Vehicle number must match format: AB09 CD1234",
  "errors": [...]
}
```

### Attempting Phone Update (Blocked)

```bash
curl -X PATCH http://localhost:5000/api/drivers/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+9876543210"
  }'
```

**Response (400):**
```json
{
  "status": "fail", 
  "message": "Phone number updates are not allowed through this endpoint",
  "errors": [...]
}
```

### Empty Update Request

```bash
curl -X PATCH http://localhost:5000/api/drivers/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (400):**
```json
{
  "status": "fail",
  "message": "At least one field must be provided for update",
  "errors": [...]
}
```

### Invalid Email Format

```bash
curl -X PATCH http://localhost:5000/api/drivers/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email"
  }'
```

**Response (400):**
```json
{
  "status": "fail",
  "message": "Please provide a valid email address",
  "errors": [...]
}
```

### No Authentication

```bash
curl -X PATCH http://localhost:5000/api/drivers/profile \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unauthorized Update"
  }'
```

**Response (401):**
```json
{
  "status": "error",
  "message": "You are not logged in. Please log in to get access."
}
```

## 📋 Validation Rules

### Name
- **Required**: No (optional)
- **Type**: String
- **Length**: 2-100 characters
- **Pattern**: Letters and spaces only (`^[a-zA-Z\s]+$`)

### Email  
- **Required**: No (optional)
- **Type**: String
- **Format**: Valid email address
- **Unique**: Must be unique among drivers

### Vehicle Type
- **Required**: No (optional)
- **Type**: String
- **Length**: Maximum 20 characters

### Vehicle Capacity
- **Required**: No (optional)
- **Type**: String
- **Example**: "4 passengers", "500kg", etc.

### Vehicle Number
- **Required**: No (optional)
- **Type**: String
- **Format**: `^[A-Z]{2}\d{2}\s[A-Z]{2}\d{4}$` (e.g., "MH09 AB1234")
- **Unique**: Must be unique among drivers

### Phone (Blocked)
- **Updates**: Not allowed through this endpoint
- **Reason**: Security - phone number is used for authentication

## 🔒 Security Features

1. **JWT Authentication**: Required
2. **Role Validation**: Only drivers can update their profile
3. **Phone Protection**: Phone updates blocked for security
4. **Uniqueness Checks**: Email and vehicle number must be unique
5. **Input Validation**: Comprehensive validation for all fields
6. **Partial Updates**: Only provided fields are updated