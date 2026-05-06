# Share Extension 動作確認手順

iOS の共有メニューから Links に URL を送る機能の確認手順です。

> **重要:** Share Extension は Expo Go では動作しません。EAS Development Build または Preview Build が必要です。

---

## 前提条件

- EAS Development Build または Preview Build がインストール済み（`eas build --profile development --platform ios`）
- Supabase プロジェクトが設定済み（`.env.local` に URL と anon key を設定）
- Links アプリにログイン済み

---

## 確認手順

### 1. Development Build のビルドとインストール

```bash
# EAS にログイン
eas login

# iOS Development Build を作成
eas build --profile development --platform ios

# ビルド完了後、EAS ダッシュボードの QR コードから実機にインストール
```

### 2. Share Extension の有効化確認

1. iOS Settings > Privacy & Security > Share Extensions（または設定 > プライバシー）を確認
2. もし Share Extension が表示されない場合は、アプリを一度開いて閉じてから再試行

### 3. URL の共有

1. Safari または任意のアプリで URL を開く（例: `https://example.com`）
2. 共有ボタン（四角から矢印が出るアイコン）をタップ
3. 「Links」アプリのアイコンをタップ（表示されない場合は「More...」から有効化）
4. Links アプリが Add Bookmark 画面で起動し、URL が自動入力されることを確認

### 4. ログイン済みの場合の動作

- Share Extension 経由で URL が渡された場合、`/(app)/add` 画面に URL が自動入力された状態で開く
- 「Add」ボタンをタップしてブックマークを保存
- 一覧画面に保存されたブックマークが表示されることを確認

### 5. 未ログインの場合の動作

- 未ログイン状態で Share Extension 経由でアクセスした場合、共有 URL を `pendingUrl` クエリパラメータに乗せてログイン画面へ遷移
- ログイン（またはサインアップ）成功後、保留していた URL を引き継いで `/(app)/add?url=<共有URL>` に自動遷移し、ブックマーク追加画面が開く

---

## トラブルシューティング

### Share Extension が表示されない

1. アプリを完全に終了して再起動
2. iOS の設定 > 一般 > デバイス管理 でプロビジョニングプロファイルを確認
3. `newArchEnabled: true` の場合、`expo-share-intent` が新アーキテクチャ非対応なら `app.json` で `"newArchEnabled": false` に変更して再ビルド

### URL が渡されない

1. `expo-share-intent` のバージョン互換性を確認（`package.json` 参照）
2. `app.json` の `plugins` に `"expo-share-intent"` が含まれていることを確認

---

## 参考コマンド

```bash
# Development Build（実機）
eas build --profile development --platform ios

# Preview Build（TestFlight 内部配布）
eas build --profile preview --platform ios

# TestFlight へ Submit
eas submit --platform ios
```
