# Links

**Links** は iPhone / Android 向けのシンプルなブックマークアプリです。URL をコレクションし、AI(Anthropic Claude Haiku)で自動的にタイトルと要約を付与、タグで整理します。

Expo + React Native で実装されており、**Expo Go アプリで QR コードを読むだけ**で手元のスマホからすぐに動作確認できます。

## MVP スコープ

- URL のブックマーク追加・一覧・削除
- URL / 概要 / タグの編集(タグはチップ UI で既存タグから選択 + 新規入力)
- タップで外部ブラウザで開く
- ファビコン表示(Google `s2/favicons`)
- AI 要約(Cloudflare Worker `/summarize` 経由で Anthropic Claude Haiku を呼ぶ)
- SQLite による永続化

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

# 3. Metro bundler 起動
npx expo start
```

コンソールに表示される QR コードを Expo Go で読むとアプリが立ち上がります。

> **ネットワークについて**: 開発マシンとスマホが同じ Wi-Fi にいれば LAN モードで OK。別ネットなら `npx expo start --tunnel` で ngrok 経由に切り替えてください。

## ディレクトリ構成

```
links/
├── app/                    # Expo Router(ファイルベースルーティング)
│   ├── _layout.tsx         # Stack ナビゲータ + 初回データロード
│   ├── index.tsx           # ブックマーク一覧画面
│   ├── add.tsx             # 追加モーダル
│   └── edit/[id].tsx       # 編集画面
├── components/
│   ├── BookmarkRow.tsx     # リスト行(ファビコン + タイトル + タグ)
│   └── TagChipEditor.tsx   # チップ UI + 新規タグ入力
├── src/
│   ├── types.ts            # Bookmark / SummaryResult
│   ├── db.ts               # expo-sqlite のスキーマ + CRUD + orphan tag 掃除
│   ├── api.ts              # Cloudflare Worker の /summarize クライアント
│   └── store.ts            # Zustand ストア(ロード / 追加 / 更新 / 削除)
├── backend/                # Cloudflare Worker(AI 要約)
└── assets/                 # アプリアイコン類
```

## バックエンド(AI 要約)

Cloudflare Worker で `POST /summarize` を提供。ページ取得 → HTML 抽出 → Anthropic Claude Haiku に投げて 2〜3 文の要約(ページ言語で返す、不明なら日本語)とタイトルを返します。

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
- **タグ階層化 / ブックマークリスト**: MVP 後に検討
- **EAS Build + TestFlight** での配信
- **検索 / フィルタ**
