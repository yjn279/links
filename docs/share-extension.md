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

### No script URL provided（JS バンドルが見つからない）

**症状**: X (Twitter) などから Links に URL を共有しようとすると、次のエラーが発生してアプリが開かない。

```
No script URL provided. Make sure the packager is running or you have embedded a JS bundle in your application bundle.
unsanitizedScriptURLString = (null)
```

**原因**: このエラーは Share Extension 自体が出しているのではなく、**Share Extension 経由で起動されたメインアプリ側**が JS バンドルを解決できなかったときに発生する。

`expo-share-intent` v5 の iOS Share Extension は純粋な UIViewController + Storyboard 実装であり、React Native ブリッジを一切ロードしない。Extension は共有 URL を App Group の UserDefaults に書き込み、`links://dataUrl=linksShareKey#weburl` というカスタム URL スキームでメインアプリを起動するだけである。エラーはその後、起動されたメインアプリの `AppDelegate`（Expo 生成物）が `RCTBundleURLProvider` を呼び出す際に発生する。

**対処: Development Build の場合**

Metro packager が起動していないことが最多の原因である。

1. Mac と iOS デバイスが同一 Wi-Fi ネットワークにあることを確認する。
2. Metro を起動する。
   ```bash
   npx expo start --dev-client
   ```
3. ネットワーク環境が複雑な場合は tunnel モードを試す。
   ```bash
   npx expo start --dev-client --tunnel
   ```
4. デバイス上の iOS 設定アプリ → Links → 開発者メニューで Metro の URL が現在の IP と一致しているか確認する。

**対処: Preview Build の場合**

`eas build --profile preview` で生成された `.ipa` に `main.jsbundle` が埋め込まれていないことが原因である。

1. EAS でビルドを再実行する。
   ```bash
   eas build --profile preview --platform ios
   ```
2. ビルドが完了したら EAS ダッシュボードからダウンロードし、ローカルで確認する。
   ```bash
   unzip Links.ipa
   ls Payload/Links.app/main.jsbundle
   ```
   ファイルが存在すれば埋め込み済みである。

**対処: Release Build の場合**

Preview と同様に `main.jsbundle` の組み込み漏れ、または Provisioning Profile / Entitlements 不整合が原因である。

1. EAS でリリースビルドを再実行する。
   ```bash
   eas build --profile production --platform ios
   ```
2. Xcode Organizer（Window → Organizer → Crashes）で crash log を確認し、スタックトレース内の `RCTBundleURLProvider` または `RCTBridge` を検索する。

**対処: 共通手順**

いずれのビルドタイプでも、ネイティブの再生成が解決することがある。

```bash
# ネイティブを完全再生成（手動で ios/ を編集していた場合はその変更が消える）
npx expo prebuild --clean

# Pods を再インストール
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

**X (Twitter) だけで再現する場合の追加確認**

- X が渡す URL に非 ASCII 文字や特殊文字が含まれ、Share Extension が生成するカスタム URL スキームが不正になっている可能性がある（仮説）。
- Console.app または Xcode で実機ログをフィルタして確認する。
  - Mac と USB 接続時: Xcode → Window → Devices and Simulators → デバイス → Open Console → フィルタ `process:Links`
  - `"redirectToHostApp canOpenURL KO"` というログが出ていれば URL スキームの解決に失敗している。

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
