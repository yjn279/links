# RLS 動作確認チェックリスト

このチェックリストは、Supabase ローカル環境（`supabase start` 後）または本番環境で
ユーザー A / ユーザー B を使い、Row Level Security が正しく機能していることを確認する手順です。

## 前提

- ローカル Supabase が起動済み（`supabase start`）
- `supabase/migrations/20260505000000_init.sql` が適用済み（`supabase db reset` または `supabase db push`）
- psql または Supabase Studio の SQL Editor が利用可能

---

## チェック項目

### 1. ユーザー A のブックマークがユーザー B から見えないこと

手順:
1. アプリからユーザー A でサインアップ / ログインする。
2. ブックマークを 2〜3 件追加する。
3. アプリからログアウトし、ユーザー B（別メールアドレス）でサインアップ / ログインする。
4. ブックマーク一覧が **0 件** であることを確認する。

期待結果: ユーザー A が作成したブックマークは一覧に表示されない。

---

### 2. ユーザー B はユーザー A のブックマークを編集・削除できないこと

手順（Supabase SQL Editor または psql 使用）:
1. ユーザー A の JWT トークンを取得する（アプリの開発ツールまたは `supabase.auth.getSession()` で確認）。
2. ユーザー B の JWT トークンを取得する。
3. ユーザー B の JWT で以下を実行（`set local role` を使って RLS をシミュレート）:

```sql
-- ユーザー B の auth.uid() をセット
set local "request.jwt.claims" = '{"sub": "<USER_B_UUID>", "role": "authenticated"}';
set local role authenticated;

-- ユーザー A のブックマーク ID を指定して UPDATE を試みる
update public.bookmarks
set title = 'hacked'
where id = '<USER_A_BOOKMARK_ID>';
-- 期待: 0 rows affected (RLS によりフィルタされる)

-- DELETE を試みる
delete from public.bookmarks
where id = '<USER_A_BOOKMARK_ID>';
-- 期待: 0 rows affected
```

期待結果: UPDATE / DELETE ともに 0 行が影響を受ける（エラーではなく RLS による無音フィルタ）。

---

### 3. タグがユーザーをまたいで見えないこと

手順:
1. ユーザー A でタグ「work」「personal」を作成する。
2. ユーザー B でログインし、タグ一覧を確認する。

期待結果: ユーザー B のタグ一覧には「work」「personal」が表示されない。

---

### 4. `bookmark_tags` がユーザー A のブックマーク ID を使ってユーザー B から書き込めないこと

手順（SQL Editor）:
1. ユーザー B の JWT で以下を実行:

```sql
set local "request.jwt.claims" = '{"sub": "<USER_B_UUID>", "role": "authenticated"}';
set local role authenticated;

-- ユーザー B が持っていない bookmark_id と tag_id を INSERT しようとする
insert into public.bookmark_tags (bookmark_id, tag_id)
values ('<USER_A_BOOKMARK_ID>', '<ANY_TAG_ID>');
-- 期待: 0 rows inserted または permission denied (RLS with check 失敗)
```

期待結果: INSERT が拒否される（RLS `with check` による）。

---

### 5. 自分のブックマークには CRUD が正常に動作すること

手順:
1. ユーザー A でログインし、ブックマークを追加・編集・削除する。
2. 各操作がエラーなく完了することを確認する。

期待結果: 追加 → 一覧反映、編集 → 変更反映、削除 → 一覧から消える。

---

## 補足: ローカル検証コマンド

```bash
# マイグレーション適用
supabase db reset

# SQL ファイルを直接 psql で実行（ローカル DB 起動後）
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -f supabase/migrations/20260505000000_init.sql
```
