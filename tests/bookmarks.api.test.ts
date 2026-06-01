/**
 * Unit tests for src/bookmarks/api.ts — listBookmarks cursor pagination.
 *
 * The Supabase client (`src/supabase`) is mocked so no env vars or network
 * access are needed. The mock returns a fluent builder chain whose terminal
 * methods resolve with configurable data/error payloads.
 *
 * Branches covered:
 *   1. No args → .range(0, 99) is called, .lt is NOT called.
 *   2. `before` supplied → .lt('created_at', before) is called with correct args.
 *   3. Returned rows === limit → nextCursor equals last row's created_at.
 *   4. Returned rows < limit → nextCursor is null.
 *   5. Supabase error propagates as thrown Error.
 *   6. Custom limit is respected in .range call.
 */

import type { Bookmark } from '../src/types';

// ---------- Mock setup ----------

/** Shared mutable result injected by each test. */
let mockData: unknown[] | null = null;
let mockError: { message: string } | null = null;

const mockRange = jest.fn();
const mockLt = jest.fn();
const mockOrder = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

/** Reset all spies and rebuild the chain before every test. */
function resetMocks(data: unknown[] | null, error: { message: string } | null = null) {
  mockData = data;
  mockError = error;

  // Each spy returns `this` (the builder) for chaining, except range/lt which
  // are terminals: they return a promise resolving to { data, error }.
  const terminal = () => Promise.resolve({ data: mockData, error: mockError });

  mockRange.mockReset().mockImplementation(terminal);
  mockLt.mockReset().mockImplementation(() => {
    // lt returns the builder so .range() can be chained after it
    return builder;
  });
  mockOrder.mockReset().mockReturnValue(builder);
  mockSelect.mockReset().mockReturnValue(builder);
  mockFrom.mockReset().mockReturnValue(builder);
}

const builder = {
  select: (...args: unknown[]) => mockSelect(...args),
  order: (...args: unknown[]) => mockOrder(...args),
  lt: (...args: unknown[]) => mockLt(...args),
  range: (...args: unknown[]) => mockRange(...args),
};

// Wire select/order to return builder
// (resetMocks sets up mockSelect and mockOrder already via mockReturnValue)

jest.mock('../src/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// ---------- Helpers ----------

function makeRow(id: string, createdAt: string) {
  return {
    id,
    user_id: 'user-1',
    url: `https://example.com/${id}`,
    title: `Title ${id}`,
    description: null,
    thumbnail_url: null,
    favicon_url: null,
    site_name: null,
    created_at: createdAt,
    updated_at: createdAt,
    tags: [],
  };
}

// ---------- Import SUT after mock is registered ----------

import { listBookmarks } from '../src/bookmarks/api';

// ---------- Tests ----------

describe('listBookmarks', () => {
  beforeEach(() => {
    resetMocks(null);
    // Re-configure mock chain so that select/order each return builder
    mockSelect.mockReturnValue(builder);
    mockOrder.mockReturnValue(builder);
    mockFrom.mockReturnValue(builder);
    // lt returns builder (so .range can be chained)
    mockLt.mockImplementation(() => builder);
    // range is the terminal — resolves with current mockData/mockError
    mockRange.mockImplementation(() =>
      Promise.resolve({ data: mockData, error: mockError }),
    );
  });

  // --- 1. No args: range(0,99), lt not called ---
  it('calls .range(0, 99) when invoked with no arguments', async () => {
    mockData = [];
    await listBookmarks();
    expect(mockRange).toHaveBeenCalledWith(0, 99);
    expect(mockLt).not.toHaveBeenCalled();
  });

  // --- 2. `before` supplied: .lt('created_at', before) called ---
  it('calls .lt("created_at", before) when before option is supplied', async () => {
    mockData = [];
    const before = '2026-01-15T10:00:00Z';
    await listBookmarks({ before });
    expect(mockLt).toHaveBeenCalledWith('created_at', before);
  });

  // --- 3. rows === limit → nextCursor = last row's created_at ---
  it('returns nextCursor equal to last row created_at when rows === limit', async () => {
    const limit = 3;
    const rows = [
      makeRow('bk1', '2026-01-03T00:00:00Z'),
      makeRow('bk2', '2026-01-02T00:00:00Z'),
      makeRow('bk3', '2026-01-01T00:00:00Z'),
    ];
    mockData = rows;

    const result = await listBookmarks({ limit });

    expect(result.nextCursor).toBe('2026-01-01T00:00:00Z');
    expect(result.bookmarks).toHaveLength(3);
    expect(mockRange).toHaveBeenCalledWith(0, limit - 1);
  });

  // --- 4. rows < limit → nextCursor = null ---
  it('returns nextCursor null when rows count is less than limit', async () => {
    const limit = 10;
    const rows = [
      makeRow('bk1', '2026-01-03T00:00:00Z'),
      makeRow('bk2', '2026-01-02T00:00:00Z'),
    ];
    mockData = rows;

    const result = await listBookmarks({ limit });

    expect(result.nextCursor).toBeNull();
    expect(result.bookmarks).toHaveLength(2);
  });

  // --- 5. Supabase error propagates ---
  it('throws an Error when Supabase returns an error', async () => {
    mockData = null;
    mockError = { message: 'DB connection failed' };

    await expect(listBookmarks()).rejects.toThrow('DB connection failed');
  });

  // --- 6. Custom limit respected in .range call ---
  it('uses the provided limit in the .range call', async () => {
    mockData = [];
    await listBookmarks({ limit: 25 });
    expect(mockRange).toHaveBeenCalledWith(0, 24);
  });

  // --- 7. Default limit is 100 when not specified ---
  it('defaults to limit 100 (range 0 to 99) when no limit is given', async () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow(`bk${i}`, `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`),
    ).reverse(); // newest first
    mockData = rows;

    const result = await listBookmarks();

    expect(mockRange).toHaveBeenCalledWith(0, 99);
    // 100 rows === limit 100 → nextCursor should be set
    expect(result.nextCursor).not.toBeNull();
  });

  // --- 8. lt not called when before is undefined ---
  it('does not call .lt when before is not provided', async () => {
    mockData = [];
    await listBookmarks({ limit: 50 });
    expect(mockLt).not.toHaveBeenCalled();
  });

  // --- 9. Bookmarks tags are correctly shaped from nested relation ---
  it('maps nested tag relation to flat tags array on each bookmark', async () => {
    const row = {
      ...makeRow('bk1', '2026-01-01T00:00:00Z'),
      tags: [
        { tag: { id: 't1', user_id: 'user-1', name: 'react', created_at: '2026-01-01T00:00:00Z' } },
        { tag: null },
      ],
    };
    mockData = [row];

    const result = await listBookmarks({ limit: 10 });

    expect(result.bookmarks[0].tags).toHaveLength(1);
    expect(result.bookmarks[0].tags[0].name).toBe('react');
  });
});
