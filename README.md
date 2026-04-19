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

## Codemagic CI

`ios-workflow` は main ブランチへの push またはプルリクエストをトリガーに、自動でビルド・テスト・TestFlight 配信を行います。

### Codemagic へのリポジトリ接続

1. [codemagic.io](https://codemagic.io) にサインインし、**Add application** をクリックします。
2. リポジトリプロバイダ（GitHub / GitLab / Bitbucket）を選択し、`links` リポジトリを選びます。
3. **Flutter App** を選択して続行します。Codemagic はルートの `codemagic.yaml` を自動検出します。

### 変数グループの作成（`links_app_group`）

Codemagic の **Teams → \<your team\> → Global variables and secrets** 画面で、グループ名 `links_app_group` を作成し、以下の変数を追加してください。すべての値は **Secure（暗号化）** に設定することを推奨します。

| 変数名 | 説明 |
|---|---|
| `LINKS_BACKEND_URL` | デプロイ済み Cloudflare Worker の URL（例: `https://links-api.your-subdomain.workers.dev`） |
| `LINKS_BACKEND_TOKEN` | Worker 側で検証するベアラートークン |
| `APP_STORE_CONNECT_KEY_IDENTIFIER` | App Store Connect API キー ID（例: `ABCDE12345`） |
| `APP_STORE_CONNECT_ISSUER_ID` | App Store Connect 発行者 UUID |
| `APP_STORE_CONNECT_PRIVATE_KEY` | `.p8` ファイルの内容をそのまま貼り付け |
| `CERTIFICATE_PRIVATE_KEY` | 配布用証明書の秘密鍵（PEM 形式） |

### App Store Connect インテグレーション

1. Apple Developer Portal で **App Store Connect API キー**（Certificates, Identifiers & Profiles → Keys）を作成します。ロールは **App Manager** 以上を推奨します。
2. Codemagic の **Teams → Settings → Integrations → App Store Connect** で、取得した Issuer ID・Key ID・`.p8` ファイルを登録します。
3. `codemagic.yaml` 内の `publishing.app_store_connect.auth: integration` がこの設定を参照します。
4. Bundle ID `com.links.app` が App Store Connect に登録済みであることを確認してください（App Store Connect → Apps → `+` → New App）。

### ワークフローの内容

| ステップ | 内容 |
|---|---|
| `flutter pub get` | パッケージ取得 |
| `build_runner build` | Drift / Riverpod コード生成 |
| `flutter analyze` | 静的解析（エラーがあればビルド失敗） |
| `flutter test --coverage` | ユニット・ウィジェットテスト、カバレッジ出力 |
| `pod install` | CocoaPods 依存関係インストール |
| コード署名 | App Store Connect から証明書・プロビジョニングプロファイルを自動取得 |
| `flutter build ipa` | リリース IPA ビルド（`LINKS_BACKEND_URL` / `LINKS_BACKEND_TOKEN` を `--dart-define` 経由で注入） |
| TestFlight 配信 | Internal Testers グループへ自動配信 |

成果物として `build/ios/ipa/*.ipa`、Xcode ビルドログ、カバレッジレポート（`coverage/lcov.info`）が保存されます。

### トラブルシューティング

**署名エラー（"No signing certificate found" など）**

- `links_app_group` 内の署名関連変数がすべて設定されているか確認します。
- `APP_STORE_CONNECT_PRIVATE_KEY` は `.p8` ファイルのヘッダー／フッター（`-----BEGIN PRIVATE KEY-----`）を含む全文を貼り付けてください。
- Codemagic の App Store Connect インテグレーションが有効化されているか再確認します。
- Bundle ID `com.links.app` が Apple Developer Portal で **Explicit** として登録されていることを確認します。

**TestFlight 配信を一時的に無効化したい場合**

`codemagic.yaml` の `publishing:` ブロック全体をコメントアウトしてください。

```yaml
    # publishing:
    #   app_store_connect:
    #     auth: integration
    #     submit_to_testflight: true
    #     beta_groups:
    #       - Internal Testers
```

**Flutter バージョンの更新**

`codemagic.yaml` の `environment.flutter` を新しいバージョン番号に変更します（例: `3.29.0` → `3.32.0`）。Flutter の最新安定版は https://docs.flutter.dev/release/release-notes で確認できます。

---

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

## 共有シート連携 (iOS Share Extension)

iOS の共有シートから Links へ URL を直接送るには、Xcode で Share Extension ターゲットを追加する必要があります。詳しいセットアップ手順は [`ios_share_extension_template/README.md`](ios_share_extension_template/README.md) を参照してください。

テンプレートフォルダ（`ios_share_extension_template/`）には以下が含まれます:

- `ShareViewController.swift` — URL を App Group (`group.com.links.app`) 経由で渡す Swift 実装
- `ShareExtension-Info.plist` — Share Extension の Info.plist テンプレート
- `Runner.entitlements.snippet` / `ShareExtension.entitlements.snippet` — 両ターゲットの entitlements に追加する App Groups 宣言

> Share Extension の設定が完了するまで、アプリは手動での URL ペーストのみで動作します。

## 現状

**pre-alpha / Slice 1 scaffold** — ディレクトリ構成とスタブファイルのみ。機能実装はこれからです。
