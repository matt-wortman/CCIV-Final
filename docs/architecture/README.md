# Architecture Documentation

This section contains architectural documentation extracted from code reviews and consolidated for easy reference.

## Documents

### [System Overview](./system-overview.md)
High-level architecture, technology stack, design decisions, and feature status.

**Topics:**
- Next.js 15 App Router architecture
- Form engine structure
- Server actions pattern
- Environment modes
- Build & deployment status
- Future opportunities

### [Data Model](./data-model.md)
Database schema, relationships, and data patterns using Prisma + PostgreSQL.

**Topics:**
- Dual form system (legacy + dynamic)
- Core models and relationships
- Prisma singleton pattern
- JSON field usage
- Performance considerations
- Migration strategies

### [Security Model](./security-model.md)
Authentication, authorization, and security considerations.

**Topics:**
- HTTP Basic Authentication
- Known security issues
- Secrets management
- Data encryption
- Security best practices
- Compliance considerations

## Reading Order

**For new developers:**
1. Start with [System Overview](./system-overview.md) for the big picture
2. Read [Data Model](./data-model.md) to understand data structures
3. Review [Security Model](./security-model.md) for security context

**For security review:**
1. [Security Model](./security-model.md) - Known issues and mitigations
2. [Data Model](./data-model.md) - Data handling patterns

**For database work:**
1. [Data Model](./data-model.md) - Schema details
2. [System Overview](./system-overview.md) - Environment setup

## Related Documentation

- [Code Reviews](../reviews/) - Detailed technical audits
- [Deployment Guide](../guides/deployment-guide.md) - Operational procedures
- [Admin Guide](../guides/admin-guide.md) - User documentation

---

**Last Updated:** 2025-10-02
**Status:** Phase 2 complete - Architecture docs extracted from reviews
