const API = process.env.API_URL || 'http://localhost:8000/api/v1';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin12345';

async function request(path, options = {}, token) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    if (['ISBN_TAKEN', 'DOCUMENT_TAKEN', 'USERNAME_TAKEN'].includes(data?.code)) return null;
    throw new Error(`${response.status} ${data?.code || ''} ${data?.message || text}`);
  }
  return data;
}

async function main() {
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
  });
  const token = login.access_token;
  const categories = await request('/categories', {}, token);

  await request('/users', {
    method: 'POST',
    body: JSON.stringify({ username: 'librarian.demo', password: 'demo12345', role: 'librarian' })
  }, token);

  const books = [];
  for (let i = 1; i <= 40; i += 1) {
    const category = categories[(i - 1) % categories.length];
    const created = await request('/books', {
      method: 'POST',
      body: JSON.stringify({
        title: `Demo Book ${String(i).padStart(2, '0')}`,
        author: `Author ${((i - 1) % 12) + 1}`,
        isbn: `978000000${String(i).padStart(4, '0')}`.slice(0, 13),
        category_id: category.id,
        total_copies: i <= 5 ? 5 : 2
      })
    }, token);
    if (created) books.push(created);
  }

  const members = [];
  for (let i = 1; i <= 10; i += 1) {
    const created = await request('/members', {
      method: 'POST',
      body: JSON.stringify({ full_name: `Demo Member ${i}`, document_number: `DOC-${String(i).padStart(3, '0')}` })
    }, token);
    if (created) members.push(created);
  }

  let loanCount = 0;
  for (let i = 0; i < 15; i += 1) {
    const member = members[i % members.length];
    const book = books[i % books.length];
    if (!member || !book) continue;
    await request('/loans', {
      method: 'POST',
      body: JSON.stringify({ member_id: member.id, items: [{ book_id: book.id }] })
    }, token);
    loanCount += 1;
  }

  console.log(JSON.stringify({
    books_attempted: 40,
    books_created_or_existing: books.length,
    members_attempted: 10,
    members_created_or_existing: members.length,
    loans_created: loanCount,
    note: 'The overdue evidence requires a controllable clock or manual database time adjustment; the API contract is used only.'
  }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
