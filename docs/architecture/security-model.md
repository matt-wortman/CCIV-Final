# Security Model

**Last Updated:** 2025-10-02

## Authentication

### Basic HTTP Authentication

The platform uses HTTP Basic Authentication implemented in Next.js middleware.

**File:** `middleware.ts` (52 lines)

#### How It Works

1. Middleware intercepts all requests
2. Checks for `Authorization: Basic` header
3. Decodes Base64 credentials
4. Compares against environment variables
5. Returns 401 with `WWW-Authenticate` header if unauthorized

#### Implementation

```typescript
// middleware.ts (simplified)
export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Basic ')) {
    return unauthorized();
  }

  const encoded = authHeader.substring(6);
  const decoded = decodeBase64(encoded);
  const [providedUser, providedPass] = decoded.split(':');

  if (providedUser === username && providedPass === password) {
    return NextResponse.next();
  }

  return unauthorized();
}
```

#### Excluded Paths

Authentication bypasses:
- `/_next/static/*` - Static assets
- `/_next/image/*` - Next.js image optimization
- `/api/health` - Health check endpoint
- `/favicon.ico` - Browser favicon

#### Configuration

Environment variables:
```bash
BASIC_AUTH_USERNAME=admin
BASIC_AUTH_PASSWORD=your-secure-password
```

**Fail-safe behavior:** If either credential variable is missing, the middleware returns HTTP 500 so the app never runs without credentials.

### Security Strengths

✅ **Browser-compatible Base64 decoding** with Node.js fallback
✅ **Static asset exclusions** prevent unnecessary auth checks
✅ **Proper WWW-Authenticate header** triggers browser password prompt
✅ **Environment-based credentials** keep secrets out of code
✅ **Fail-closed guard** returns HTTP 500 if credentials are missing, preventing anonymous access due to misconfiguration
✅ **Sanitized logging** redacts payloads from production console output

### Current Tester Identity (Shared User)

While the platform still relies on Basic Auth, everyone signs in with the same credentials during user testing. To keep listings consistent, the application now resolves the "current user" to a static identifier (`shared-user`, overrideable via `NEXT_PUBLIC_TEST_USER_ID`). As a result, all authenticated testers can see every draft and submission by default.

- **Implication:** There is no per-user isolation today. All authenticated requests share the same identifier in the database.
- **Mitigation:** Continue to treat basic-auth credentials as confidential. When real user accounts arrive, replace the shared identifier with the authenticated subject ID and reintroduce per-user filters or RBAC as needed.

## Security Issues & Mitigations

### 1. Timing Attack Vulnerability ⚠️

**Status:** Known issue
**Severity:** IMPORTANT
**File:** `middleware.ts:32`

#### The Problem

Current password comparison uses standard string equality (`===`):

```typescript
if (providedUser === username && providedPass === password) {
  return NextResponse.next()
}
```

**Risk:** An attacker can measure response times to determine password length and characters.

#### Recommended Fix

Use constant-time comparison:

```typescript
import { timingSafeEqual } from 'crypto';

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return timingSafeEqual(bufA, bufB);
}

// Update middleware:
if (constantTimeEqual(providedUser, username) &&
    constantTimeEqual(providedPass, password)) {
  return NextResponse.next()
}
```

**Reference:** Node.js `crypto.timingSafeEqual` documentation

### 2. Missing Error Handling ⚠️

**Status:** Known issue
**Severity:** IMPORTANT
**File:** `middleware.ts:7-12`

#### The Problem

Base64 decoding can throw on malformed input:

```typescript
function decodeBase64(value: string) {
  if (typeof atob === 'function') {
    return atob(value)  // ❌ Can throw
  }
  return Buffer.from(value, 'base64').toString('utf-8')  // ❌ Can throw
}
```

**Risk:** Malformed authorization headers crash the middleware.

#### Recommended Fix

Add try-catch with proper error response:

```typescript
function decodeBase64(value: string): string | null {
  try {
    if (typeof atob === 'function') {
      return atob(value)
    }
    return Buffer.from(value, 'base64').toString('utf-8')
  } catch {
    return null
  }
}

// Update usage:
const decoded = decodeBase64(encoded)
if (!decoded) {
  return new Response('Invalid authorization header', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Tech Triage"' }
  })
}
```

### 3. Secrets Management 🔄

**Status:** Planned improvement
**Severity:** NICE TO HAVE

#### Current State

Credentials stored as environment variables in Azure App Service configuration (inline secrets).

#### Future State

Migrate to Azure Key Vault with managed identity:

**Benefits:**
- Centralized secret management
- Automatic rotation support
- Audit logging
- No secrets in configuration files
- RBAC-based access control

**Blockers:** Requires RBAC permissions to be granted

## Authorization

Currently, the platform has **no authorization layer** beyond authentication. All authenticated users have full access.

### Future Authorization Needs

1. **Role-Based Access Control (RBAC)**
   - Admin - Full form builder access
   - Reviewer - Can submit and review triage forms
   - Viewer - Read-only access

2. **Resource-Level Permissions**
   - Template ownership
   - Submission visibility
   - Export restrictions

3. **Audit Trail**
   - Who accessed what
   - When changes were made
   - Action history

## Data Security

### Database Access

- **Connection string:** Stored in environment variables
- **TLS:** Enforced for Azure Flexible Server connections
- **Network:** Azure Virtual Network integration (production)

### Data at Rest

- **Database encryption:** Azure-managed encryption
- **Backup encryption:** Automatic via Azure Backup

### Data in Transit

- **HTTPS:** Required for all external connections
- **Database TLS:** Enforced for Prisma connections

## Sensitive Data Handling

### PII (Personally Identifiable Information)

Forms may contain:
- Inventor names
- Contact information
- Institutional affiliations

**Current protection:**
- Authentication required for all access
- HTTPS encryption in transit
- Azure-managed encryption at rest

**Gaps:**
- No field-level encryption for extra-sensitive data
- No data retention policies
- No automated PII detection/masking

### File Uploads

The schema supports file uploads (`FieldType.FILE_UPLOAD`), but current implementation status is unclear.

**Security considerations:**
- File type validation
- Virus scanning
- Size limits
- Secure storage (Azure Blob Storage recommended)
- Access control

## Security Best Practices

### Currently Implemented ✅

1. Environment-based secrets
2. HTTPS in production
3. Database encryption (Azure-managed)
4. Cascade deletes prevent orphaned data
5. Input validation via Prisma schema

### Recommended Additions ⚠️

1. Fix timing attack vulnerability (high priority)
2. Add error handling to Base64 decode (high priority)
3. Implement RBAC (medium priority)
4. Add audit logging (medium priority)
5. Migrate to Key Vault (low priority, blocked)
6. Add rate limiting to prevent brute force (low priority)

## Security Headers

**Status:** Not documented

Recommend adding Next.js security headers:

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];
```

## Compliance Considerations

### HIPAA (if handling health data)

- Requires audit logging ❌
- Requires data encryption ✅
- Requires access controls ⚠️ (partial)
- Requires data retention policies ❌

### GDPR (if handling EU data)

- Right to access ❌
- Right to erasure ❌
- Data portability ❌
- Consent management ❌

**Note:** Compliance requirements depend on data types and user locations.

## Incident Response

**Status:** No documented incident response plan

Recommended components:
1. Security contact information
2. Breach notification procedures
3. Log retention policies
4. Backup/restore procedures (see [Deployment Guide](../guides/deployment-guide.md))

## References

- [Code Review: Database Layer](../reviews/2025-10-initial-review/01-database-layer.md) - Security findings
- [Deployment Guide](../guides/deployment-guide.md) - Production security setup
- [System Overview](./system-overview.md) - Architecture context
