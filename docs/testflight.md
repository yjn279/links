# TestFlight と CI

EAS を用いた TestFlight 配信と、 PR ごとのブランチプレビューを自動配信する CI の構成をまとめる。

## 概要

配信に関わる要素と責務を以下に示す。

| 要素 | 役割 |
| :-- | :-- |
| `eas.json` の `production` プロファイル | TestFlight 用の store ビルドを定義する ( build number は EAS が remote で自動採番 ) |
| `eas.json` の `submit.production` | App Store Connect への submit 先 ( `appleTeamId` ) を定義する |
| `.github/workflows/testflight.yml` | PR と main push を起点に EAS ビルドをキューし、 TestFlight へ自動 submit する |
| EAS Environment Variables | `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` をクラウドビルドへ注入する |
| App Store Connect API Key | EAS が署名証明書の生成と submit を非対話で行うための鍵 |

## 仕組み

ブランチプレビューは TestFlight の同一アプリ内で build number により区別する。 PR を出すと最新コミットがビルドされ、 TestFlight の内部テスターに配信される。バージョン表記 ( 例 `0.0.1` ) は共通で、 build number が PR ごとに増える。どのビルドがどの PR かは EAS ダッシュボードの build message ( `PR #<番号> · <ブランチ> · <タイトル>` ) で判別する。

実ビルドと submit は EAS サーバ側で走る。 GitHub Actions は `--no-wait` でビルドをキューに積むだけなので、 runner の実行時間はほぼ消費しない。進捗と成否は EAS ダッシュボードと TestFlight 側で確認する。

## 初回セットアップ

一度だけ必要な手順を示す。 2 以降は鍵がそろえば非対話で完了する。

### App Store Connect API Key の発行

App Store Connect の Users and Access から Integrations の App Store Connect API を開き、 Admin ロールで鍵を生成する。ダウンロードした `AuthKey_XXXXXXXXXX.p8` と Key ID 、 Issuer ID を控える。 `.p8` は再ダウンロードできないため安全に保管する。

### EAS へ API Key を登録

`eas credentials` を実行し、 iOS → production → App Store Connect API Key の流れで鍵を登録する。これにより EAS が署名証明書の生成と submit を非対話で実行できるようになる。

### v0.0.1 の初回ビルドと配信

署名証明書がまだ無い場合、初回ビルド時に EAS が API Key 経由で自動生成する。次のコマンドで v0.0.1 をビルドし TestFlight へ送る。

```bash
eas build --platform ios --profile production --auto-submit
```

### GitHub Secret の登録

expo.dev の Account Settings → Access Tokens で Robot 用のアクセストークンを発行し、リポジトリの Secret に登録する。 CI から EAS を操作するために使う。

```bash
gh secret set EXPO_TOKEN --body "<発行したトークン>"
```

## ブランチプレビュー

PR を作成 ( または draft から ready 化、再 open 、追加 push ) すると `testflight.yml` が起動し、 `production` プロファイルでビルドして TestFlight へ自動 submit する。 draft PR ではビルドしない。スマホの TestFlight アプリで対象 build number を選び、動作を確認する。

手動で再ビルドしたい場合は Actions タブから `TestFlight` ワークフローを `workflow_dispatch` で実行する。

## リリース

main へ push すると同じワークフローがリリースビルドを TestFlight へ配信する。バージョンを上げる場合は `app.json` の `expo.version` を変更する。 build number は EAS が自動採番するため手動更新は不要。

## トラブルシューティング

詰まりやすい点を示す。

| 症状 | 対処 |
| :-- | :-- |
| CI ビルドが署名エラーで失敗する | 初回ビルドを必ずローカルで通し、 EAS に署名証明書を生成・保存しておく |
| submit が App Store Connect で弾かれる | API Key のロールが Admin か、 `eas.json` の `appleTeamId` が `54NL57R2BY` か確認する |
| Supabase 接続が本番ビルドで失敗する | `eas env:list production` で `EXPO_PUBLIC_SUPABASE_*` が登録されているか確認する |
| build number 重複で submit 不可 | `eas.json` の `cli.appVersionSource` が `remote` 、 `production` が `autoIncrement: true` か確認する |
