# CLAUDE.md

このリポジトリで Claude Code が作業する際の前提と運用ルール。

---

## 検証環境の優先順位

新しい機能の検証・回帰確認は、原則として次の優先順位で実施する。実機 (iPhone/Android デバイス) を使う前に、PC 上で完結する方法を必ず試す。

### 1. 第一選択: Expo Go

- 触っている機能が **Expo SDK の範囲内** で完結するなら Expo Go で確認する。
- 起動コマンド:
  ```bash
  npx expo start
  ```
- 起動後にターミナルに表示される `exp://...` 形式の URL を**必ずユーザーに共有する**こと（例: `exp://192.168.1.10:8081`）。ユーザーが手元の iPhone の Expo Go アプリから読み込めるようにするため。QR コードだけでなく URL 文字列もメッセージに貼る。
- 同一 Wi-Fi 制約があるネットワーク状況で繋がらない場合は `--tunnel` フラグを追加し、ngrok 経由の URL を共有する:
  ```bash
  npx expo start --tunnel
  ```

### 2. 第二選択: iOS Simulator + 開発ビルド

次のいずれかに該当する場合、Expo Go では検証できないため iOS Simulator (Xcode 同梱) を使う:

- **config plugin** が必要な機能（例: `expo-share-intent` の Share Extension）
- **カスタムネイティブモジュール**（Expo SDK に含まれない `pod` を入れている等）
- `app.json` の `plugins` に Expo Go 非対応のものが入っている
- `newArchEnabled: true` で Expo Go との互換性が崩れる場面

手順:

```bash
# Expo CLI が prebuild + xcodebuild + simctl install + simctl launch を一括実行
npx expo run:ios --device "iPhone 16"
```

`--device` の値は `xcrun simctl list devices available` で確認できる任意のシミュレータ名でよい。

Share Extension の動作確認は Simulator の Safari から URL を開き、共有シートで対象アプリを選ぶ流れで再現できる（初回は `More` → `Edit` で有効化が必要な場合あり）。

### 3. 第三選択: 実機 (iPhone/Android)

Simulator でも再現できない場合のみ実機ビルドを依頼する。実機検証はユーザー側で `Cmd+R` を走らせる必要があり、フィードバックループが遅いので最後の手段。実機が必要な典型ケース:

- カメラ・センサー・Bluetooth・Apple Pay など Simulator が再現しない機能
- App Store 配布前の最終確認
- 実機固有のパフォーマンス計測

---

## 関連ドキュメント

- iOS Share Extension のセットアップ・トラブルシューティング: [`docs/share-extension.md`](./docs/share-extension.md)
- Supabase RLS チェックリスト: [`docs/rls-checklist.md`](./docs/rls-checklist.md)
