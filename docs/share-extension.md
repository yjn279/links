# Share Extension / Share Intent

iOS と Android の共有メニューから Links に URL を送る機能のビルド方針と動作確認手順をまとめる。iOS の Share Extension および Android の Share Intent は Expo Go では動作しないため、Simulator / エミュレータもしくは Development / Preview ビルドが必要になる。

## OS 別の共有導線

OS によって共有の届き方と処理経路が異なる。

| OS | 共有の仕組み | 処理経路 |
| :-- | :-- | :-- |
| iOS | Share Extension から deep link ( `links://dataUrl=<key>` ) として届く | `app/+native-intent.tsx` → `app/shareintent.tsx` → `/(app)/add` |
| Android | `ACTION_SEND` として `MainActivity` に届く | `AndroidShareHandler` が `hasShareIntent` を監視し `/(app)/add` へ遷移 |

## iOS ビルド経路

検証目的と利用可能なリソースによってビルド経路が分かれる。それぞれの特徴を以下に示す。

| 経路 | コマンド | 用途 |
| :-- | :-- | :-- |
| iOS Simulator | `npx expo run:ios --device "iPhone 16"` | ローカルでの開発と回帰確認 ( PC 完結 ) |
| EAS Development Build | `eas build --profile development --platform ios` | 実機での Hot Reload を伴う開発 |
| EAS Preview Build | `eas build --profile preview --platform ios` | TestFlight 内部配布、最終確認 |
| Xcode ローカルビルド | workspace を開いて `Cmd+R` | EAS を使わずに実機で検証する場合 |

## Android ビルド経路

| 経路 | コマンド | 用途 |
| :-- | :-- | :-- |
| Android エミュレータ | `npx expo run:android` | ローカルでの開発と回帰確認 |
| EAS Development Build | `eas build --profile development --platform android` | 実機での Hot Reload を伴う開発 |
| EAS Preview Build | `eas build --profile preview --platform android` | 内部配布、最終確認 |

エミュレータを使う場合は Android Studio の AVD Manager でエミュレータが起動済みであることを確認してから `npx expo run:android` を実行する。実機を使う場合は USB デバッグを有効にした状態で接続する。

## 前提条件

検証に共通して必要な準備を以下に示す。

- Supabase プロジェクトの URL と anon key が `.env` に設定されている
- 検証対象のビルドが端末または Simulator / エミュレータにインストール済み
- Supabase Auth にログイン用アカウントが作成済み

## iOS 動作確認手順

検証は次の流れで実施する。

1. Safari または任意のアプリで URL を開く
2. 共有ボタンをタップし、候補に Links が表示されるか確認する
3. Links を選択すると Add Bookmark 画面が起動し、URL が自動入力される
4. Add ボタンでブックマークを保存し、一覧画面で反映を確認する

ログイン状態によりアプリ側の挙動が変わる。違いを以下に示す。

| 状態 | 挙動 |
| :-- | :-- |
| ログイン済み | `/(app)/add` 画面が直接開き、URL が自動入力された状態で待機する |
| 未ログイン | 共有 URL が `pendingUrl` クエリに乗ってログイン画面へ遷移し、認証成功後に `/(app)/add?url=<共有URL>` へ自動遷移する |

## Android 動作確認手順

Android の Share Intent は実機またはエミュレータで検証する。Simulator は利用できない。

### ビルドとインストール

```bash
npx expo run:android
```

または EAS でビルドした APK / AAB をエミュレータ・実機にインストールする。

### 共有の手順

1. Chrome または任意のアプリで URL を開く
2. 共有ボタンをタップし、共有シートに Links が表示されるか確認する
3. Links を選択すると `MainActivity` が起動し、`AndroidShareHandler` が `ACTION_SEND` を受け取る
4. `/(app)/add` 画面が開き、URL が自動入力された状態で待機する
5. Add ボタンでブックマークを保存し、一覧画面で反映を確認する

ログイン状態によりアプリ側の挙動が変わる。違いを以下に示す。

| 状態 | 挙動 |
| :-- | :-- |
| ログイン済み | `/(app)/add` 画面が直接開き、URL が自動入力された状態で待機する |
| 未ログイン | `/(auth)/login` 画面へ遷移し、認証成功後に `/(app)/add?url=<共有URL>` へ自動遷移する |

### インテントフィルタの確認

`app.json` の `expo-share-intent` プラグイン設定に `androidIntentFilters: ["text/*"]` が明示されていることを確認する。`npx expo prebuild --platform android --no-install` を実行し、生成された `android/app/src/main/AndroidManifest.xml` の `.MainActivity` に次の要素が含まれていれば正しく設定されている。

- `android.intent.action.SEND`
- `android.intent.category.DEFAULT`
- `android:mimeType="text/*"`
- `android:launchMode="singleTask"`

確認後、`android/` ディレクトリは削除する（CNG 運用のため `.gitignore` 対象）。

## Xcode ローカルビルドのセットアップ

EAS を使わず Xcode から直接ビルドする場合の準備手順を示す。 `expo-share-intent` は config plugin として実装されているため、 `expo prebuild` を経由しないと `ios/` 配下に Share Extension ターゲットが生成されない点に注意する。

ターゲットが存在するかは次の 2 コマンドで確認できる。

```bash
grep -E '/\* ShareExtension \*/' ios/Links.xcodeproj/project.pbxproj
ls ios/ShareExtension/
```

`ls` の期待出力は `MainInterface.storyboard` 、 `ShareExtension-Info.plist` 、 `ShareExtension.entitlements` 、 `ShareExtensionPreprocessor.js` 、 `ShareViewController.swift` の 5 ファイル。何も出ない場合は plugin 適用前の状態で `ios/` が固まっているので、次の手順で再生成する。

```bash
npx expo prebuild --clean --platform ios
cd ios && pod install && cd ..
```

実行ログに次の行が出ていれば成功している。

```
[expo-share-intent] add ios share extension (scheme:links groupIdentifier:group.com.yjn279.links)
[expo-share-intent] Successfully created ShareExtension target with files
```

prebuild は `ios/` を作り直すため、Xcode UI で手動設定していた `DEVELOPMENT_TEAM` が落ちる。 `app.json` に `ios.appleTeamId` を pin しておけば自動で復元される。

```json
"ios": {
  "bundleIdentifier": "com.yjn279.links",
  "appleTeamId": "54NL57R2BY"
}
```

Xcode 側では `ios/Links.xcworkspace` を開き、Links と ShareExtension の両ターゲットで `Signing & Capabilities` を確認する。具体的に必要な設定を以下に示す。

| 対象 | 設定内容 |
| :-- | :-- |
| Links ターゲット | Automatic signing オン、Team を設定 |
| ShareExtension ターゲット | Automatic signing オン、Team を Links と同一に設定 |
| 双方の Signing & Capabilities | `App Groups: group.com.yjn279.links` が表示されている |

ShareExtension は別 bundle id `com.yjn279.links.share-extension` を持つため Apple Developer Portal でプロビジョニングプロファイルが必要になるが、Automatic signing が有効なら Xcode が自動生成する。

## トラブルシューティング

### Share Extension が共有シートに出ない

最も多い原因は `ShareExtension.appex` がアプリバンドルに埋め込まれていないことである。次のチェックを順に実施する。

| 順序 | 確認内容 | 対処 |
| :-: | :-- | :-- |
| 1 | `ios/ShareExtension/` と pbxproj の ShareExtension ターゲットの有無 | 欠けていれば `npx expo prebuild --clean --platform ios` を実行 |
| 2 | インストール済み `.app/PlugIns/ShareExtension.appex` の有無 | 欠けていれば Clean Build Folder 後に `Cmd+R` で再ビルド |
| 3 | ShareExtension ターゲットの Team 設定 | 未設定なら Xcode で Team を割当てて再ビルド |
| 4 | アプリの完全終了と再起動 | 共有シートのキャッシュを更新する |
| 5 | 共有シート末尾の More から Edit で Links を有効化 | 初回は表示順から外れていることがある |
| 6 | パッケージ整合性 | `expo-share-intent@6` は新アーキ対応済み。`package.json` のバージョンが SDK 55 要求版と一致しているか確認する |

`.app/PlugIns/ShareExtension.appex` の確認コマンドは次のとおり。

```bash
ls ~/Library/Developer/Xcode/DerivedData/Links-*/Build/Products/Debug-iphoneos/Links.app/PlugIns/
```

特に詰まりやすいのは `expo prebuild --clean` 直後の初回ビルドで、 `app.json` に `appleTeamId` を pin する前にビルドしてしまうケース。 pbxproj に `DEVELOPMENT_TEAM` が無いまま走るとメインアプリは install されるが ShareExtension は codesign 失敗で drop されるため、共有シートに Links が出ない。 `app.json` を修正してから `prebuild --clean` をやり直し、Xcode で Clean Build Folder を実行してから再ビルドすることで解消する。

### URL が渡されない

メインアプリは起動するが URL が反映されない場合の確認項目を以下に示す。

| 項目 | 確認内容 |
| :-- | :-- |
| パッケージ整合性 | `expo-share-intent` のバージョンが Expo SDK と互換か ( `package.json` を参照 ) |
| plugins 登録 | `app.json` の `plugins` 配列に `expo-share-intent` が含まれているか |
| App Group の entitlements | `ios/Links/Links.entitlements` と `ios/ShareExtension/ShareExtension.entitlements` の双方に `group.com.yjn279.links` があるか |
| メインアプリ Info.plist | `AppGroupIdentifier = group.com.yjn279.links` キーが存在するか |

### No script URL provided

Debug ビルドで Metro packager が見つからない時に `No script URL provided. unsanitizedScriptURLString = (null)` が出る。 `ios/Links/AppDelegate.swift` の `bundleURL()` が DEBUG では `RCTBundleURLProvider.sharedSettings().jsBundleURL(...)` を返すため、Metro が動いていない、もしくは到達できない場合に `nil` になる。

最初に Metro の起動状態と作業ディレクトリを確認する。過去の trinity worktree などで起動しっぱなしの `expo start` がいると 8081 を奪い、本体リポジトリの Metro が起動できず別ポートに退避することがある。

```bash
lsof -iTCP:8081 -sTCP:LISTEN
pgrep -fl "expo start"
```

stray なプロセスがいれば停止させ、本体リポジトリで起動し直す。

```bash
cd /Users/yuji/Documents/links
npx expo start --dev-client
```

Mac と iPhone が同一 Wi-Fi にあるかも確認する。別 LAN なら `--tunnel` で ngrok 経由にする。それでも繋がらない場合は Xcode の Scheme を Release に切り替え、JS バンドルを `.app` に焼き込んでビルドする。Metro 非依存になり、Share Extension からの再起動シナリオの検証も安定する。
