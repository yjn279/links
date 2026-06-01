# Links

iOS/Android ネイティブのブックマークアプリ。URL を保存し、タグ付け・フィルタ・ソートで管理できます。iOS Share Extension・Android Share Intent から任意のアプリの共有メニューで URL を直接送ることも可能です。

---

## 機能一覧

- メールアドレス + パスワードによるサインアップ / ログイン / ログアウト
- ブックマークの一覧・追加・編集・削除
- タグの追加・選択・削除（ユーザーごとに独立）
- タグ AND フィルタ + キーワード検索（タイトル / URL 部分一致）
- 登録日ソート（新しい順 / 古い順）
- OG メタデータ自動取得（Supabase Edge Function `fetch-meta`）
- iOS Share Extension 対応（`expo-share-intent`）
- Android Share Intent 対応（他アプリの共有メニューから URL を追加）

---

## 必要環境

| ツール | バージョン |
|--------|-----------|
| Node.js | 18 以上 |
| Expo CLI | `npx expo` で自動解決 |
| Supabase CLI | 最新安定版 (`brew install supabase/tap/supabase`) |
| EAS CLI | `npm install -g eas-cli` |
| Apple Developer アカウント | Share Extension / TestFlight に必要 |

---

## セットアップ手順

### 1. リポジトリのクローンと依存インストール

```bash
git clone https://github.com/yjn279/links.git
cd links
npm install --legacy-peer-deps
```

### 2. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を開き、Supabase プロジェクトの URL と anon key を設定します。

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> Supabase の URL と anon key は Supabase ダッシュボード > Settings > API で確認できます。

> **env 未設定で起動した場合:** `.env.local` が存在しないまま `npx expo start` を実行すると、アプリは「Supabase Setup Required」画面を表示します。クラッシュはしません。上記の手順で `.env.local` を作成し、Metro を再起動（`npx expo start --clear`）すると通常の画面に切り替わります。

### 3. Supabase セットアップ

#### 3-a. Supabase プロジェクトの作成

1. [https://supabase.com](https://supabase.com) にアクセスし、新規プロジェクトを作成します。
2. プロジェクトの URL と anon key を `.env.local` に設定します（手順 2）。

#### 3-b. マイグレーションの適用

```bash
# ローカル Supabase を使う場合
supabase start
supabase db reset

# 本番 Supabase に適用する場合
supabase link --project-ref <your-project-ref>
supabase db push
```

または psql で直接実行:

```bash
psql <YOUR_SUPABASE_DATABASE_URL> -f supabase/migrations/20260505000000_init.sql
```

#### 3-c. Edge Function のデプロイ

```bash
supabase functions deploy fetch-meta
```

ローカル動作確認:

```bash
supabase functions serve fetch-meta
```

### 4. Expo Go での動作確認

```bash
npx expo start
```

QR コードを Expo Go アプリ（iOS / Android）でスキャンしてください。

> **注意:** Share Extension は Expo Go では動作しません。Share Extension の検証には Development Build または Preview Build が必要です（後述）。

---

## EAS Development Build（Share Extension を含む完全動作確認）

### 前提

- [EAS アカウント](https://expo.dev) の作成と `eas-cli` のログイン
- Apple Developer Program への加入
- Xcode のインストール

### ビルドとインストール

```bash
# EAS へのログイン
eas login

# iOS Development Build（実機 / シミュレータ）
eas build --profile development --platform ios

# ビルド完了後、.ipa を実機にインストール（QR または ADB）
```

---

## 配信自動化（CI/CD）

EAS と GitHub Actions により、ブランチプレビューとリリースを自動配信します。

- **ブランチプレビュー:** PR を作成・更新すると、iOS は TestFlight に自動配信され、Android は内部配布 APK のインストールリンクが PR にコメントされます。
- **リリース:** GitHub Release を `vX.Y.Z` タグで publish すると、iOS の store ビルドが App Store Connect へ自動 submit されます。

構成・初回セットアップ・トラブルシューティングは [`docs/ci-cd.md`](docs/ci-cd.md) を参照してください。手動でビルドする場合は次のとおりです。

```bash
eas build --profile preview --platform ios   # 内部配布
eas build --profile production --platform ios --auto-submit   # TestFlight / App Store
```

---

## Share Extension の確認手順

> Share Extension は Expo Go では動作しません。Development Build または Preview Build が必要です。

詳細は [`docs/share-extension.md`](docs/share-extension.md) を参照してください。

---

## 環境変数一覧

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase プロジェクトの URL | はい |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon (public) key | はい |

---

## ディレクトリ構成

```
links/
├── app/
│   ├── _layout.tsx              ルート Stack（セッション初期化、Share Intent リスナ）
│   ├── index.tsx                ルートリダイレクト
│   ├── (auth)/                  未ログイン用ルートグループ
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── sign-up.tsx
│   └── (app)/                   ログイン必須ルートグループ
│       ├── _layout.tsx
│       ├── index.tsx            ブックマーク一覧（フィルタ / ソート）
│       ├── add.tsx              ブックマーク追加
│       └── edit/[id].tsx        ブックマーク編集・削除
├── components/
│   ├── BookmarkRow.tsx          一覧行コンポーネント
│   ├── TagChipEditor.tsx        タグ編集 UI
│   ├── BookmarkFilters.tsx      フィルタ / ソート UI
│   └── AuthForm.tsx             ログイン / サインアップ共通フォーム
├── src/
│   ├── supabase.ts              Supabase クライアント（SecureStore adapter）
│   ├── types.ts                 型定義
│   ├── auth/
│   │   ├── store.ts             認証状態 Zustand store
│   │   └── use-auth.ts          認証 hook
│   ├── bookmarks/
│   │   ├── api.ts               Supabase CRUD 関数群
│   │   ├── store.ts             ブックマーク Zustand store
│   │   └── filters.ts           フィルタ / ソート純粋関数
│   ├── meta/
│   │   └── client.ts            Edge Function `fetch-meta` 呼び出しクライアント
│   └── share-intent.ts          expo-share-intent ラッパ
├── supabase/
│   ├── config.toml              Supabase CLI 設定
│   ├── migrations/              DB マイグレーション
│   └── functions/
│       └── fetch-meta/          OG メタ取得 Edge Function
├── tests/
│   ├── bookmarks.filters.test.ts
│   └── meta.parse.test.ts
├── docs/
│   ├── ci-cd.md                 配信自動化（CI/CD）の構成
│   ├── rls-checklist.md         RLS 動作確認チェックリスト
│   └── share-extension.md       Share Extension 確認手順
├── .env.example
└── eas.json
```

---

## RLS の動作確認

[`docs/rls-checklist.md`](docs/rls-checklist.md) を参照してください。

---

## 既知の制限

- Share Extension は Expo Go では動作しません（Development Build が必要）。
- `expo-share-intent` が新アーキテクチャ非対応の場合は `app.json` の `newArchEnabled` を `false` にしてください。
- Android の Share Intent は実機 / エミュレータでの動作確認が必要です。Simulator では検証できません（`npx expo run:android` または EAS ビルドを使用してください）。
