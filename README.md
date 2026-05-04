# Links

**Links** は iPhone / Android 向けのシンプルなブックマークアプリです。URL をコレクションし、AI(Anthropic Claude Haiku)で自動的にタイトルと要約を付与、タグで整理します。

Expo + React Native で実装されており、**Expo Go アプリで QR コードを読むだけ**で手元のスマホからすぐに動作確認できます。

## MVP スコープ

- URL のブックマーク追加・一覧・削除
- URL / 概要 / タグの編集(タグはチップ UI で既存タグから選択 + 新規入力)
- タップで外部ブラウザで開く
- **サムネイル表示**（OGP `og:image` / `twitter:image`）+ ファビコン表示(Google `s2/favicons`)
- **登録日の相対表記**（今日 / 昨日 / N 日前 / N 週間前 / N か月前 / YYYY/MM/DD）
- **タグでフィルタ**（複数選択 AND 絞り込み）
- **並び順切替**（登録日 新しい順 / 登録日 古い順 / タイトル昇順）
- AI 要約(Cloudflare Worker `/summarize` 経由で Anthropic Claude Haiku を呼ぶ)
- SQLite による永続化
- **Supabase Auth**（メール + パスワードでサインイン / サインアップ / サインアウト）
  - env 未設定ではゲストモードで動作（認証不要、ローカル CRUD のみ）

> **iOS Share Extension**（共有シートからの直接追加）は後続スプリントの予定です。Expo Go QR 起動と非互換のため、dev client 化が必要になります。

## 動作確認手順(Expo Go)

### 前提

- [Expo Go](https://expo.dev/go) をスマホにインストール(iPhone / Android とも無料)
- 開発マシンに Node.js 20 以上

### 手順

```bash
# 1. クローンと依存インストール
git clone https://github.com/yjn279/links.git
cd links
npm install --legacy-peer-deps

# 2. (任意)AI 要約バックエンドを設定。未設定でも手動追加・編集は動作。
export EXPO_PUBLIC_LINKS_BACKEND_URL="https://<your-worker>.workers.dev"
export EXPO_PUBLIC_LINKS_BACKEND_TOKEN="<shared-bearer-token>"

# 3. (任意)Supabase Auth を有効にする場合のみ設定。未設定ではゲストモードで動作。
export EXPO_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="<anon-public-key>"

# 4. Metro bundler 起動
npx expo start
```

コンソールに表示される QR コードを Expo Go で読むとアプリが立ち上がります。

> **ネットワークについて**: 開発マシンとスマホが同じ Wi-Fi にいれば LAN モードで OK。別ネットなら `npx expo start --tunnel` で ngrok 経由に切り替えてください。

## Supabase Auth 設定

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. **Settings → API** から `Project URL` と `anon public` キーをコピー
3. 上記の環境変数 `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` に設定
4. `npx expo start` を再起動するとサインイン画面が表示される

**env 未設定時の挙動**: アプリは起動し、ローカル CRUD・タグ・フィルタ・ソート・サムネイル・登録日表示が全て動作します（ゲストモード）。

## ディレクトリ構成

```
links/
├── app/                    # Expo Router(ファイルベースルーティング)
│   ├── _layout.tsx         # Stack ナビゲータ + Auth 振り分け + 初回データロード
│   ├── (auth)/             # 認証ルートグループ
│   │   ├── sign-in.tsx     # サインイン画面
│   │   └── sign-up.tsx     # サインアップ画面
│   ├── index.tsx           # ブックマーク一覧画面（フィルタ / ソート付き）
│   ├── add.tsx             # 追加モーダル
│   └── edit/[id].tsx       # 編集画面（サムネイル / 登録日 / タグ）
├── components/
│   ├── BookmarkRow.tsx     # リスト行(サムネイル / ファビコン / タイトル / タグ / 登録日)
│   ├── TagChipEditor.tsx   # チップ UI + 新規タグ入力
│   ├── TagFilterBar.tsx    # タグフィルタ横スクロールチップバー
│   └── SortMenu.tsx        # 並び順切替モーダルメニュー
├── src/
│   ├── types.ts            # Bookmark / SummaryResult（imageUrl 追加）
│   ├── db.ts               # expo-sqlite のスキーマ + CRUD + orphan tag 掃除
│   ├── api.ts              # Cloudflare Worker の /summarize クライアント
│   ├── store.ts            # Zustand ストア（ロード / 追加 / 更新 / 削除 / userId）
│   ├── auth.ts             # Supabase Auth クライアント + expo-secure-store セッション
│   └── dateFormat.ts       # epoch → 相対表記 純関数
├── backend/                # Cloudflare Worker(AI 要約 + og:image 抽出)
└── assets/                 # アプリアイコン類
```

## バックエンド(AI 要約)

Cloudflare Worker で `POST /summarize` を提供。ページ取得 → HTML 抽出 → Anthropic Claude Haiku に投げて 2〜3 文の要約(ページ言語で返す、不明なら日本語)とタイトル、**OGP 画像 URL (`imageUrl`)** を返します。

```bash
cd backend
npm install
wrangler secret put ANTHROPIC_API_KEY      # 実シークレット
wrangler secret put LINKS_BACKEND_TOKEN     # 実シークレット
wrangler deploy
```

詳細は `backend/README.md` を参照してください。

## 今後のロードマップ

- **iOS Share Extension**: `expo-share-extension`(dev client 必須)で共有シートから直接追加
- **クラウド同期**: Supabase Postgres にブックマークをレプリケーション
- **タグ階層化 / ブックマークリスト**: MVP 後に検討
- **EAS Build + TestFlight** での配信
- **検索**: 全文検索機能
