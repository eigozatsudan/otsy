# Orders Service

The Orders Service handles the core business logic for managing shopping orders in the okaimonoDX platform. It provides functionality for users to create orders, shoppers to accept and manage orders, and administrators to oversee the entire order lifecycle.

## Overview

The Orders Service is responsible for:
- Order creation and management
- Order status tracking and transitions
- Shopper assignment and order acceptance
- Receipt approval workflows
- Order history and filtering
- Integration with LLM services for voice-to-order conversion

## Architecture

### Core Components

- **OrdersController**: REST API endpoints for order operations
- **OrdersService**: Business logic and data access layer
- **Order DTOs**: Data transfer objects for request/response validation
- **Order Status Management**: State machine for order lifecycle

### Dependencies

- **PrismaService**: Database operations
- **LlmService**: AI-powered order creation from voice/text input
- **Auth Guards**: JWT authentication and role-based access control

## API Endpoints

### User Endpoints

#### Create Order
```http
POST /v1/orders
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "mode": "approve" | "delegate",
  "receipt_check": "required" | "auto",
  "estimate_amount": 1000,
  "deadline_ts": "2023-12-01T14:00:00Z",
  "priority": 5,
  "address_json": {
    "postal_code": "100-0001",
    "prefecture": "Tokyo",
    "city": "Chiyoda",
    "address_line": "1-1-1 Chiyoda",
    "building": "Building A",
    "delivery_notes": "Ring doorbell"
  },
  "items": [
    {
      "name": "Milk",
      "qty": "1L",
      "price_min": 200,
      "price_max": 300,
      "allow_subs": true,
      "note": "Organic preferred"
    }
  ]
}
```

#### Create Order from LLM Session
```http
POST /v1/orders/from-llm-session
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "session_id": "llm-session-123",
  "mode": "approve",
  "receipt_check": "required",
  "address_json": { ... },
  "deadline_ts": "2023-12-01T14:00:00Z",
  "priority": 5
}
```

#### Create Order from Voice Input
```http
POST /v1/orders/from-voice
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "voice_input": "I need milk and bread for breakfast",
  "mode": "approve",
  "receipt_check": "required",
  "address_json": { ... },
  "existing_items": ["eggs"],
  "dietary_restrictions": ["lactose-free"],
  "budget_level": 3
}
```

#### Preview Shopping List
```http
POST /v1/orders/preview-shopping-list
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "input": "I need groceries for the week",
  "existing_items": ["milk", "bread"],
  "dietary_restrictions": ["vegetarian"],
  "budget_level": 4
}
```

#### Get My Orders
```http
GET /v1/orders/my-orders?status=new&page=1&limit=20
Authorization: Bearer <user_token>
```

#### Approve Receipt
```http
POST /v1/orders/{order_id}/approve
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "decision": "ok" | "ng",
  "reason": "Items look correct"
}
```

#### Cancel Order
```http
DELETE /v1/orders/{order_id}
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "reason": "Changed my mind"
}
```

#### Authorize Payment
```http
POST /v1/orders/{order_id}/authorize-payment
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "payment_method_id": "pm_1234567890"
}
```

### Shopper Endpoints

#### Get Available Orders
```http
GET /v1/orders/available?page=1&limit=20
Authorization: Bearer <shopper_token>
```

#### Accept Order
```http
POST /v1/orders/{order_id}/accept
Authorization: Bearer <shopper_token>
Content-Type: application/json

{
  "note": "Will complete within 2 hours",
  "estimated_completion": "2023-12-01T14:00:00Z"
}
```

#### Update Order Status
```http
PATCH /v1/orders/{order_id}/status
Authorization: Bearer <shopper_token>
Content-Type: application/json

{
  "status": "shopping" | "arrived_store" | "purchased" | "await_receipt_ok" | "enroute" | "delivered",
  "notes": "Started shopping at 10:30 AM",
  "location": {
    "latitude": 35.6762,
    "longitude": 139.6503
  }
}
```

### Admin Endpoints

#### Get All Orders
```http
GET /v1/orders?status=new&user_id=user-123&shopper_id=shopper-456&page=1&limit=20
Authorization: Bearer <admin_token>
```

#### Admin Update Status
```http
PATCH /v1/orders/{order_id}/admin-status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "cancelled",
  "notes": "Customer requested cancellation"
}
```

### Shared Endpoints

#### Get Order Details
```http
GET /v1/orders/{order_id}
Authorization: Bearer <token>
```

## Data Models

### Order Status Enum
```typescript
enum OrderStatus {
  NEW = 'new',
  ACCEPTED = 'accepted',
  SHOPPING = 'shopping',
  AWAIT_RECEIPT_OK = 'await_receipt_ok',
  ENROUTE = 'enroute',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}
```

### Order Mode Enum
```typescript
enum OrderMode {
  APPROVE = 'approve',    // User must approve each item
  DELEGATE = 'delegate'   // Shopper can make decisions
}
```

### Receipt Check Enum
```typescript
enum ReceiptCheck {
  REQUIRED = 'required',  // User must approve receipt
  AUTO = 'auto'          // Automatic approval
}
```

### Order Item Structure
```typescript
interface CreateOrderItemDto {
  name: string;           // Item name
  qty: string;           // Quantity (e.g., "1L", "2kg")
  price_min?: number;    // Minimum expected price
  price_max?: number;    // Maximum expected price
  allow_subs?: boolean;  // Allow substitutions
  note?: string;         // Additional notes
}
```

### Address Structure
```typescript
interface AddressJson {
  postal_code: string;    // Postal code
  prefecture: string;     // Prefecture
  city: string;          // City
  address_line: string;  // Street address
  building?: string;     // Building name/number
  delivery_notes?: string; // Delivery instructions
}
```

## Business Logic

### Order Creation Flow

1. **Validation**: User exists and is authenticated
2. **Order Creation**: Create order record with NEW status
3. **Item Creation**: Create order items in transaction
4. **Audit Log**: Record order creation event
5. **Response**: Return complete order details

### Order Acceptance Flow

1. **Shopper Validation**: Check shopper eligibility (active, KYC approved)
2. **Order Validation**: Ensure order is NEW and unassigned
3. **Assignment**: Assign shopper to order, update status to ACCEPTED
4. **Audit Log**: Record acceptance event
5. **Response**: Return updated order details

### Status Transition Rules

The service enforces strict status transition rules based on the actor's role:

#### User Transitions
- NEW → CANCELLED
- AWAIT_RECEIPT_OK → ENROUTE (approve) or SHOPPING (reject)

#### Shopper Transitions
- ACCEPTED → SHOPPING
- SHOPPING → AWAIT_RECEIPT_OK
- ENROUTE → DELIVERED

#### Admin Transitions
- Any status → CANCELLED (for disputes/refunds)
- ACCEPTED → SHOPPING (force start)
- SHOPPING → AWAIT_RECEIPT_OK (force completion)
- AWAIT_RECEIPT_OK → ENROUTE (force approval)

### Receipt Approval Workflow

1. **Shopper Completes Shopping**: Status changes to AWAIT_RECEIPT_OK
2. **Receipt Upload**: Shopper uploads receipt (handled by ReceiptsService)
3. **User Review**: User reviews receipt and items
4. **Approval Decision**: User approves (ENROUTE) or rejects (SHOPPING)
5. **Audit Log**: Record approval decision

## Error Handling

### Common Error Responses

- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions for the operation
- **404 Not Found**: Order, user, or shopper not found
- **400 Bad Request**: Invalid data or invalid status transition
- **422 Unprocessable Entity**: Validation errors

### Validation Rules

- **Order Amount**: Must be between 100 and 100,000 JPY
- **Priority**: Must be between 1 and 10
- **Items**: Must have at least one item
- **Address**: Must include postal_code, prefecture, city, and address_line
- **Status Transitions**: Must follow defined transition rules

## Integration Points

### LLM Service Integration

The Orders Service integrates with the LLM Service for:
- **Voice-to-Order**: Convert voice input to structured order data
- **Shopping List Generation**: AI-powered item suggestions
- **Session Management**: Maintain conversation context for order creation

### Payment Service Integration

- **Payment Authorization**: Authorize payments for orders
- **Payment Processing**: Handle payment capture and refunds
- **Payment Methods**: Manage user payment methods

### Receipt Service Integration

- **Receipt Upload**: Handle receipt image uploads
- **Receipt Processing**: Extract item details from receipts
- **Receipt Validation**: Verify receipt authenticity

## Testing

### Unit Tests
- Service method testing with mocked dependencies
- Status transition validation
- Error handling scenarios
- Data validation

### Integration Tests
- End-to-end API testing
- Database transaction testing
- Authentication and authorization testing
- Cross-service integration testing

### Test Coverage
- Controller endpoints: 100%
- Service methods: 95%+
- Error scenarios: 90%+
- Edge cases: 85%+

## Performance Considerations

### Database Optimization
- Indexed queries on user_id, shopper_id, status
- Pagination for large result sets
- Transaction batching for related operations

### Caching Strategy
- Order details caching for frequent access
- Shopper availability caching
- Status transition validation caching

### Rate Limiting
- Order creation rate limiting per user
- Status update rate limiting per shopper
- API endpoint rate limiting

## Security Considerations

### Authentication
- JWT token validation for all endpoints
- Role-based access control (RBAC)
- Token expiration and refresh handling

### Authorization
- User can only access their own orders
- Shopper can only access assigned orders
- Admin can access all orders

### Data Protection
- Sensitive data encryption
- Audit logging for all operations
- Input validation and sanitization

## Monitoring and Logging

### Audit Logging
- All order operations are logged
- Actor identification and role tracking
- Payload capture for debugging
- Timestamp and IP address logging

### Metrics
- Order creation rate
- Status transition frequency
- Error rates by endpoint
- Response time monitoring

### Alerts
- High error rates
- Unusual order patterns
- Failed status transitions
- System performance degradation

## Future Enhancements

### Planned Features
- **Order Templates**: Save and reuse common orders
- **Bulk Operations**: Create multiple orders at once
- **Order Scheduling**: Schedule orders for future delivery
- **Real-time Notifications**: WebSocket updates for order status
- **Advanced Filtering**: Complex search and filter options
- **Order Analytics**: Detailed reporting and insights

### Technical Improvements
- **Event Sourcing**: Complete audit trail of all changes
- **CQRS**: Separate read and write models
- **Microservice Split**: Separate order management from order processing
- **GraphQL API**: More flexible querying capabilities
- **Webhook Support**: Real-time notifications to external systems
