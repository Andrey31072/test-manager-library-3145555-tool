# SDD Implementation Notes

This utility repository contains the demo seeder.
It uses only the public API and never writes SQL directly.

Run after the API is migrated and the initial admin exists:

```bash
npm run seed
```

The seeder creates or reuses:

- At least 40 books.
- At least 10 members.
- 15 loans.
- A demo librarian.

The reference evidence asks for exactly three overdue lines. The current API has no test clock endpoint, and the spec forbids hidden extra scope; therefore this seeder does not mutate the database directly to fake dates.
