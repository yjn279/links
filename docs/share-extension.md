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

## Xcode 実機ビルドでのセットアップ（EAS を使わない場合）

EAS Build を使わず、ローカルの Xcode から実機にインストールするケースの手順。`expo-share-intent` は **config plugin** なので、`expo prebuild` が走らないと iOS 側に Share Extension ターゲットが作られない点に注意。

### Share Extension が共有シート候補に出ない場合のチェック

`ios/Links.xcodeproj/project.pbxproj` に `ShareExtension` ターゲットが存在しないと、いくらビルドが成功して実機にアプリが入っても共有シートに出ない。次のいずれかで確認できる:

```bash
# pbxproj に ShareExtension ターゲットがあるか
grep -E '/\* ShareExtension \*/' ios/Links.xcodeproj/project.pbxproj

# ShareExtension ディレクトリ一式があるか
ls ios/ShareExtension/
# 期待: MainInterface.storyboard, ShareExtension-Info.plist,
#       ShareExtension.entitlements, ShareExtensionPreprocessor.js,
#       ShareViewController.swift
```

何も出ない場合は `ios/` が plugin 適用前の状態で固まっている。

### ネイティブ再生成手順

```bash
# 1. ios/ を作り直して config plugin を再適用
npx expo prebuild --clean --platform ios

# 2. Pods 再インストール（prebuild が自動実行するが念のため）
cd ios && pod install && cd ..
```

実行後、prebuild ログに次の行が出ていれば ShareExtension が追加されている:

```
[expo-share-intent] add ios share extension (scheme:links groupIdentifier:group.com.yjn279.links)
[expo-share-intent] Successfully created ShareExtension target with files
```

### Xcode 側で必要な signing 設定

`expo prebuild --clean` は `ios/` を丸ごと作り直すため、Xcode UI で手動設定していた `DEVELOPMENT_TEAM` が消える。`app.json` の `ios.appleTeamId` に Team ID を書いておくと自動で復元される:

```json
"ios": {
  "bundleIdentifier": "com.yjn279.links",
  "appleTeamId": "54NL57R2BY"
}
```

Xcode で `ios/Links.xcworkspace`（`.xcodeproj` ではなく workspace）を開いて:

1. **Links** ターゲット → `Signing & Capabilities` → `Automatically manage signing` ON / Team を設定
2. **ShareExtension** ターゲット → 同様に `Automatically manage signing` ON / 同じ Team を設定
3. 両ターゲットの `Signing & Capabilities` に `App Groups: group.com.yjn279.links` が出ていることを確認（`*.entitlements` から自動読込）
4. 実機を接続して `Cmd+R`

ShareExtension は別 bundle id (`com.yjn279.links.share-extension`) を持つため、Apple Developer Portal にプロビジョニングプロファイルを生成する必要がある。`Automatically manage signing` がオンなら Xcode が自動生成する。

---

## トラブルシューティング

### Share Extension が表示されない

1. **`ios/ShareExtension/` ディレクトリと pbxproj の ShareExtension ターゲットが存在するか確認**（上記 "Xcode 実機ビルドでのセットアップ" 参照）。無ければ `npx expo prebuild --clean --platform ios` を実行
2. アプリを完全に終了して再起動
3. 共有シートを一番下までスクロール → `More` → `Edit` で Links を有効化（初回は表示順から外れることがある）
4. iOS の設定 > 一般 > デバイス管理 でプロビジョニングプロファイルを確認
5. `newArchEnabled: true` の場合、`expo-share-intent` が新アーキテクチャ非対応なら `app.json` で `"newArchEnabled": false` に変更して再ビルド

### URL が渡されない

1. `expo-share-intent` のバージョン互換性を確認（`package.json` 参照）
2. `app.json` の `plugins` に `"expo-share-intent"` が含まれていることを確認
3. メインアプリ・ShareExtension 双方の entitlements に `group.com.yjn279.links` が入っていることを確認（`ios/Links/Links.entitlements` と `ios/ShareExtension/ShareExtension.entitlements`）
4. メインアプリ側 `Info.plist` に `AppGroupIdentifier = group.com.yjn279.links` キーがあることを確認

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
