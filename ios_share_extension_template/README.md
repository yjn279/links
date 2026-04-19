# iOS Share Extension セットアップ手順

このフォルダには、Links アプリ用 iOS Share Extension を Xcode プロジェクトに追加するためのテンプレートファイルが含まれています。

---

## 前提条件

- リポジトリをクローン後、以下のコマンドで iOS プロジェクト構造を生成済みであること。

  ```bash
  flutter create . --project-name=links --platforms=ios --org=com.links
  flutter pub get
  dart run build_runner build --delete-conflicting-outputs
  ```

- `ios/` ディレクトリが存在し、`ios/Runner.xcworkspace` が開けること。
- Apple Developer Program に登録済みで、Bundle ID `com.links.app` が登録済みであること。

---

## 手順

### 1. ワークスペースを Xcode で開く

```bash
open ios/Runner.xcworkspace
```

### 2. Share Extension ターゲットを追加する

1. Xcode メニュー: **File → New → Target**
2. **iOS** タブで **Share Extension** を選択し、**Next**
3. 以下を設定:
   - **Product Name**: `ShareExtension`
   - **Language**: Swift
   - **Embed in Application**: `Runner`
4. **Finish** をクリック。Xcode が `Activate "ShareExtension" scheme?` と聞いてきたら **Cancel**（Runner スキームのままビルドするため）。

Bundle ID は自動的に `com.links.app.ShareExtension` になります。Runner の Bundle ID（`com.links.app`）を親として持つことを確認してください。

### 3. ShareViewController.swift を置き換える

Xcode プロジェクトナビゲータで `ShareExtension/ShareViewController.swift` を選択し、内容を `ShareViewController.swift`（このフォルダ）の内容に丸ごと置き換えてください。

### 4. Info.plist を置き換える

`ShareExtension/Info.plist` の内容を `ShareExtension-Info.plist`（このフォルダ）の内容に置き換えてください。

> `NSExtensionActivationSupportsWebURLWithMaxCount: 1` により、Web URL を 1 件だけ受け取る拡張として登録されます。

### 5. App Groups を両ターゲットに有効化する

**Runner ターゲット**:

1. プロジェクトナビゲータ → `Runner` ターゲット → **Signing & Capabilities** タブ
2. **+ Capability** → **App Groups**
3. `+` ボタンで `group.com.links.app` を追加

**ShareExtension ターゲット**:

同じ手順で `ShareExtension` ターゲットにも `group.com.links.app` を追加してください。

### 6. Entitlements ファイルを更新する

Xcode が自動生成する entitlements ファイル（`ios/Runner/Runner.entitlements` および `ios/ShareExtension/ShareExtension.entitlements`）に、`Runner.entitlements.snippet` と `ShareExtension.entitlements.snippet` の内容をマージしてください。

既存の entitlements ファイルに `<dict>` ブロック内のキーが存在しない場合のみ追加します（重複しないよう注意）。

```xml
<key>com.apple.security.application-groups</key>
<array>
  <string>group.com.links.app</string>
</array>
```

> Signing & Capabilities の UI から App Groups を追加すると Xcode が自動で entitlements に書き込む場合があります。その場合は手動編集不要です。

### 7. デプロイメントターゲットを設定する

両ターゲット（`Runner` と `ShareExtension`）の **General → Minimum Deployments** を **iOS 15.0** に設定してください。

### 8. ビルドと動作確認

1. Xcode で **Runner** スキームを選択し、実機（iPhone）でビルド・実行します。
2. Safari などで任意の Web ページを開き、共有ボタン → **Links** を選択します。
3. 投稿ボタンをタップすると、アプリが起動してブックマークが追加されます。

> Share Extension はシミュレータの共有シートでは動作確認が困難です（シミュレータの Share Extension 一覧に表示されない場合があります）。実機でテストしてください。

---

## ファイル一覧

| ファイル | 説明 |
|---|---|
| `ShareViewController.swift` | Share Extension の本体。共有された URL を App Group の UserDefaults に保存する |
| `ShareExtension-Info.plist` | Share Extension ターゲットの Info.plist テンプレート |
| `Runner.entitlements.snippet` | Runner ターゲットの entitlements に追加する App Groups 宣言 |
| `ShareExtension.entitlements.snippet` | ShareExtension ターゲットの entitlements に追加する App Groups 宣言 |

---

## データフロー

```
[iOS Share Sheet]
      │ ユーザーが Links を選択
      ▼
[ShareViewController.swift]
      │ URL を group.com.links.app の UserDefaults に保存
      ▼
[share_handler パッケージ] ← Dart 側の ShareHandlerIntentSource が読み取る
      │
      ▼
[shareIntentListenerProvider]
      │ BookmarksNotifier.add(url) を呼び出す
      ▼
[BookmarkRepository] → Drift DB に保存
```

コールドスタート（アプリが起動していない状態）では `getInitialUrl()` で URL を読み取り、ウォームスタート（アプリが既に起動中）では `urlStream` 経由で URL が届きます。

---

## 注意事項

- Share Extension は `group.com.links.app` App Group を通じてデータを共有します。Runner と ShareExtension の両方に同じ App Group が設定されていないと URL の受け渡しに失敗します。
- `share_handler` パッケージのバージョンによって `SharedMedia` の API 形状（`content` フィールド名など）が異なる場合があります。`lib/features/share/data/share_handler_intent_source.dart` のコメントを参照してください。
- このテンプレートフォルダ（`ios_share_extension_template/`）は Flutter のビルドには含まれません。`ios/` ディレクトリの外に配置されているため、Xcode ビルドシステムからは参照されません。
