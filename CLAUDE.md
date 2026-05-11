# CLAUDE.md

このリポジトリで Claude Code が作業する際の前提と運用ルールをまとめる。プロジェクトのセットアップ全体は [`README.md`](./README.md) を参照する。

## プロジェクト概要

Expo Router を用いたブックマークアプリで、フロントエンドとデータレイヤの責務を以下のように分担している。

| レイヤ | 構成 |
| :-- | :-- |
| フロント | `app/` ( Expo Router ) と `src/` ( Supabase クライアント、Zustand stores、ロジック ) と `components/` |
| データ | Supabase Postgres ( RLS ) と Edge Function `fetch-meta` ( `supabase/functions/` ) |
| バックエンド | `backend/` 配下の Cloudflare Worker ( 独自 `tsconfig.json` を持ちルートからは除外 ) |
| iOS Share Extension | `expo-share-intent` config plugin が `ios/ShareExtension/` を生成 |

## よく使うコマンド

開発フローで頻出するコマンドを用途別に示す。

| 用途 | コマンド |
| :-- | :-- |
| テスト実行 | `npm test` |
| Lint | `npm run lint` |
| 型チェック | `npx tsc --noEmit` |
| Metro 起動 ( Expo Go 向け ) | `npx expo start` |
| Simulator ビルド・起動 | `npx expo run:ios --device "iPhone 16"` |
| iOS ネイティブ再生成 | `npx expo prebuild --platform ios` |
| ローカル DB 再構築 | `supabase db reset` |
| Edge Function ローカル起動 | `supabase functions serve fetch-meta` |

## 検証環境の優先順位

検証は PC 内で完結する手段を最優先とし、Simulator でも再現できないケースに限り実機を使う。三段階の使い分けを以下に示す。

| 優先順位 | 環境 | 用途 |
| :-: | :-- | :-- |
| 1 | Expo Go | Expo SDK の範囲内で完結する機能の確認 |
| 2 | iOS Simulator | config plugin、カスタムネイティブモジュール、新アーキテクチャ依存など Expo Go で動かない機能 |
| 3 | 実機 ( iPhone / Android ) | カメラ、センサー、Apple Pay など Simulator が再現しない機能と App Store 配布前の最終確認 |

### Expo Go

`npx expo start` を起動した後、ターミナルに表示される `exp://192.168.x.x:8081` 形式の URL を必ずユーザーに共有する。QR コードだけでは手元で開けないケースがあるため、URL 文字列をメッセージに貼り付ける。同一 Wi-Fi で繋がらない場合は `npx expo start --tunnel` で ngrok 経由の URL を共有する。

### iOS Simulator

`npx expo run:ios --device "iPhone 16"` を使うと Expo CLI が prebuild、 `xcodebuild` 、 `simctl install` 、 `simctl launch` を一括で実行する。 `--device` の値は `xcrun simctl list devices available` で確認できる任意のシミュレータ名でよい。Share Extension は Simulator 内 Safari から URL を開き、共有シートで対象アプリを選ぶ流れで再現できる。初回は共有シート末尾の More から Edit で Links を有効化する必要がある。

### 実機

Simulator でも再現できない場合のみ、ユーザーに次のテンプレートで依頼する。

> `ios/Links.xcworkspace` を Xcode で開き、 `Product → Clean Build Folder` ( `Cmd+Shift+K` ) を実行してから iPhone を選んで `Cmd+R` をお願いします。

## 注意点

過去のセッションで詰まった固有の罠を以下に示す。新しいセッションでも踏みやすいため、関連作業に着手する前に確認する。

| 項目 | 内容 |
| :-- | :-- |
| `npm install --legacy-peer-deps` 必須 | React 19 と各種 expo パッケージの peer dep を解決するため、フラグなしではインストールが失敗する |
| `expo prebuild --clean` 後の Clean Build Folder | 古い build artifact と signing 設定の差分により `ShareExtension.appex` が codesign 失敗で drop され、メインアプリのみが install されて共有シートに出なくなる |
| `app.json` の `ios.appleTeamId` | prebuild のたびに `DEVELOPMENT_TEAM` が落ちないよう pin する。値は `54NL57R2BY` |
| stale Metro による 8081 占有 | 過去の trinity worktree ( `.trinity/<run>/worktree/` ) で起動しっぱなしの `expo start` が 8081 を奪うことがあり、 `lsof -iTCP:8081` と `pgrep -fl "expo start"` で診断する |
| `backend/` はルート tsconfig から除外 | Cloudflare Worker 配下は `backend/tsconfig.json` を使うため、ルートの `npx tsc --noEmit` には含まれない。backend を触る時は `cd backend && npx tsc --noEmit` を実行する |

## 関連ドキュメント

詳細手順は専用ドキュメントに分割している。対象作業に応じて参照する。

| ドキュメント | 内容 |
| :-- | :-- |
| [`docs/share-extension.md`](./docs/share-extension.md) | iOS Share Extension のビルド方針とトラブルシューティング |
| [`docs/rls-checklist.md`](./docs/rls-checklist.md) | Supabase RLS の動作確認チェックリスト |
