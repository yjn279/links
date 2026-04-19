# Links

## Links の目的

Links は、日常的に出会う Web ページや記事を手軽に保存・管理するための、シンプルな個人向け iOS ブックマークアプリです。iOS の共有シートから直接 URL を送ることができ、アプリが自動的にページタイトルとサマリーを取得・生成します。AI（Anthropic Claude）によるタグ付けと要約機能により、後から必要な情報をすばやく見つけられます。

情報収集のストレスをなくし、読みたいものをあとでかんたんに探し出せる体験を目指しています。技術的な複雑さを利用者から隠し、「保存する → 後で読む・探す」という最小限のフローに集中しています。

## MVP スコープ

- iOS 共有シートから URL を受け取り、ブックマークとして保存
- ページタイトル・OGP 画像・AI サマリーの自動取得
- AI による自動タグ付けと手動タグ編集
- ブックマーク一覧・検索・タグフィルタ
- ブックマークの削除とアーカイブ

## ディレクトリ構成概要

```
links/
├── lib/
│   ├── main.dart                  # エントリポイント
│   ├── app.dart                   # MaterialApp.router + Riverpod
│   └── core/
│       ├── constants.dart         # --dart-define 定数
│       ├── routing/app_router.dart
│       ├── network/               # HTTP クライアント (Slice 2)
│       └── database/              # Drift DB (Slice 1)
│   └── features/
│       ├── bookmarks/             # ブックマーク機能
│       └── tags/                  # タグ機能
├── test/                          # ユニット・ウィジェットテスト
├── backend/                       # Cloudflare Worker (Slice 2)
├── pubspec.yaml
├── codemagic.yaml
└── .env.example
```

## 開発手順

### 初回セットアップ

クローン後、まず Flutter の iOS プロジェクト構造を生成してください。

```bash
flutter create . --project-name=links --platforms=ios --org=com.links
```

次に依存パッケージを取得します。

```bash
flutter pub get
```

コード生成（Drift/Riverpod）を実行します。

```bash
dart run build_runner build --delete-conflicting-outputs
```

### アプリの実行

```bash
# .env.local に LINKS_BACKEND_URL と LINKS_BACKEND_TOKEN を記述したうえで:
flutter run --dart-define-from-file=.env.local
```

### テスト

```bash
flutter test
```

## バックエンドのセットアップ概要

バックエンドは Cloudflare Workers (TypeScript) で実装します（Slice 2 以降）。

```bash
cd backend
npm install
# シークレットの設定
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put LINKS_BACKEND_TOKEN
# ローカル開発
wrangler dev
# デプロイ
wrangler deploy
```

詳細は `backend/README.md` を参照してください。

## Codemagic の注意点

`codemagic.yaml` の署名関連変数（`CERTIFICATE_PRIVATE_KEY`, `PROVISIONING_PROFILE`, etc.）はプレースホルダです。実際のビルドを走らせるには Codemagic の UI 上で対応する環境変数を設定してください。Slice 5 で本格的な CI 設定を実装します。

## 現状

**pre-alpha / Slice 1 scaffold** — ディレクトリ構成とスタブファイルのみ。機能実装はこれからです。
