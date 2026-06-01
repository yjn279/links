/**
 * Unit tests for src/bookmarks/filters.ts
 */
import { applyFilters } from '../src/bookmarks/filters';
import type { Bookmark } from '../src/types';

function makeTag(id: string, name: string): { id: string; user_id: string; name: string; created_at: string } {
  return { id, user_id: 'user-1', name, created_at: '2026-01-01T00:00:00Z' };
}

function makeBookmark(
  id: string,
  overrides: Partial<Bookmark> = {},
): Bookmark {
  return {
    id,
    user_id: 'user-1',
    url: `https://example.com/${id}`,
    title: `Title ${id}`,
    description: null,
    thumbnail_url: null,
    favicon_url: null,
    site_name: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    tags: [],
    ...overrides,
  };
}

const tagWork = makeTag('t-work', 'work');
const tagPersonal = makeTag('t-personal', 'personal');
const tagDev = makeTag('t-dev', 'dev');

const bk1 = makeBookmark('bk1', {
  title: 'React Handbook',
  url: 'https://react.dev',
  tags: [tagWork, tagDev],
  created_at: '2026-01-01T10:00:00Z',
});

const bk2 = makeBookmark('bk2', {
  title: 'Personal Blog',
  url: 'https://myblog.com/posts',
  tags: [tagPersonal],
  created_at: '2026-01-02T10:00:00Z',
});

const bk3 = makeBookmark('bk3', {
  title: 'TypeScript Docs',
  url: 'https://typescriptlang.org',
  tags: [tagWork],
  created_at: '2026-01-03T10:00:00Z',
});

const bk4 = makeBookmark('bk4', {
  title: null,
  url: 'https://github.com/explore',
  tags: [tagWork, tagDev, tagPersonal],
  created_at: '2026-01-04T10:00:00Z',
});

const ALL = [bk1, bk2, bk3, bk4];

describe('applyFilters', () => {
  describe('tag AND filter', () => {
    it('case 1: no tag filter returns all bookmarks', () => {
      const result = applyFilters(ALL, { tagIds: [], query: '', sortAsc: false });
      expect(result.map((b) => b.id)).toEqual(['bk4', 'bk3', 'bk2', 'bk1']);
    });

    it('case 2: single tag filter returns only matching bookmarks', () => {
      const result = applyFilters(ALL, { tagIds: ['t-personal'], query: '', sortAsc: false });
      const ids = result.map((b) => b.id);
      expect(ids).toContain('bk2');
      expect(ids).toContain('bk4');
      expect(ids).not.toContain('bk1');
      expect(ids).not.toContain('bk3');
    });

    it('case 3: AND filter with two tags returns only bookmarks that have BOTH tags', () => {
      // work AND dev -> bk1 and bk4 only
      const result = applyFilters(ALL, {
        tagIds: ['t-work', 't-dev'],
        query: '',
        sortAsc: false,
      });
      const ids = result.map((b) => b.id);
      expect(ids).toContain('bk1');
      expect(ids).toContain('bk4');
      expect(ids).not.toContain('bk2');
      expect(ids).not.toContain('bk3');
    });

    it('case 4: AND filter with all three tags returns only bk4', () => {
      const result = applyFilters(ALL, {
        tagIds: ['t-work', 't-dev', 't-personal'],
        query: '',
        sortAsc: false,
      });
      expect(result.map((b) => b.id)).toEqual(['bk4']);
    });
  });

  describe('free-text filter', () => {
    it('case 5: query matches title (case-insensitive)', () => {
      const result = applyFilters(ALL, { tagIds: [], query: 'react', sortAsc: false });
      expect(result.map((b) => b.id)).toEqual(['bk1']);
    });

    it('case 6: query matches URL (case-insensitive)', () => {
      const result = applyFilters(ALL, { tagIds: [], query: 'github', sortAsc: false });
      expect(result.map((b) => b.id)).toEqual(['bk4']);
    });

    it('case 7: query matches no bookmarks returns empty array', () => {
      const result = applyFilters(ALL, { tagIds: [], query: 'zzz-no-match', sortAsc: false });
      expect(result).toHaveLength(0);
    });

    it('case 11: query matches description when title is null', () => {
      const bkDesc = makeBookmark('bk-desc', {
        title: null,
        url: 'https://example.com/bk-desc',
        description: 'xylophone-unique-term overview',
        tags: [],
        created_at: '2026-01-05T10:00:00Z',
      });
      const result = applyFilters([...ALL, bkDesc], {
        tagIds: [],
        query: 'xylophone-unique-term',
        sortAsc: false,
      });
      expect(result.map((b) => b.id)).toEqual(['bk-desc']);
    });
  });

  describe('sort', () => {
    it('case 8: sortAsc=false (default) returns newest first', () => {
      const result = applyFilters(ALL, { tagIds: [], query: '', sortAsc: false });
      const dates = result.map((b) => b.created_at);
      expect(dates[0] > dates[1]).toBe(true);
      expect(dates[1] > dates[2]).toBe(true);
    });

    it('case 9: sortAsc=true returns oldest first', () => {
      const result = applyFilters(ALL, { tagIds: [], query: '', sortAsc: true });
      const dates = result.map((b) => b.created_at);
      expect(dates[0] < dates[1]).toBe(true);
      expect(dates[1] < dates[2]).toBe(true);
    });
  });

  describe('combined filter + sort', () => {
    it('case 10: tag filter + query + sort all applied together', () => {
      // Filter: work tag, query "type" -> should match bk3 (TypeScript Docs, work tag)
      const result = applyFilters(ALL, {
        tagIds: ['t-work'],
        query: 'type',
        sortAsc: true,
      });
      expect(result.map((b) => b.id)).toEqual(['bk3']);
    });
  });
});
