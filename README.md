# 生態系ネットワーク解析機能

![概要](./img/greendashboard_001.png)

## 更新履歴
| 更新日時     | リリース       | 更新内容                                       |
|-------------|--------------|----------------------------------------------|
| 2026/3/**  | 1st Release  | 初版リリース |


## 1. 概要 
本リポジトリでは、2025年度のProject PLATEAUで開発した「生態系ネットワーク解析機能」のソースコードを公開しています。

「樹木データを活用した温熱環境シミュレータの開発」樹木管理ダッシュボードは、PLATEAUの3D都市モデルを活用して樹木管理業務をDXし、効率的な緑地管理の実現を目指すものです。

## 2. 「生態系ネットワーク解析機能」について 
「生態系ネットワーク解析機能」は、樹木管理台帳システムです。地方公共団体や民間企業等がこれまで紙やPDFなどで管理し、形式や所在が統一されていなかった緑地関連データを、一元的にデータベースで管理する機能を整備することで、効率的な樹木管理を実現することを目的としています。

本システムの詳細については[技術検証レポート](https://www.mlit.go.jp/plateau/file/libraries/doc/*****)を参照してください。

## 3. 利用手順 
本システムの構築手順及び利用手順については[利用チュートリアル](https://project-plateau.github.io/green-dashboard)を参照してください。

## 4. システム概要
### 【樹木管理台帳】
#### ①樹木台帳（地図・リスト表示）
- 樹木台帳データベースに登録されている樹木データを地図上およびリストで表示します
- 樹木ごとの詳細情報を個票で表示します

#### ②検索・絞り込み、エクスポート
- リストから条件（樹種・樹高など）を絞り込みで表示します。絞り込みと地図上の樹木ポイントが連動します
- 絞り込んだ結果は、Excel形式でダウンロードできます。

#### ③集計表、エクスポート　
- 予め設定した条件に応じて自動集計した結果を表示します
- 集計した結果は、、Excel形式でダウンロードできます。

### 【文書管理】
#### ①文書管理（リスト表示）
- 3D都市モデルやPDF等の関連データの登録、検索、リストを表示します。


## 5. 利用技術

| 種別 | 名称 | バージョン | 内容 |
| --- | --- | --- | --- |
| オープンソースソフトウェア | [PostGIS](https://github.com/postgis/postgis) | 3.x | PostgreSQLで位置情報を扱うことを可能とする拡張機能 |
| オープンソースライブラリ | [React](https://github.com/facebook/react) | 19.2.0 | UIを構築するためのJavaScriptライブラリ |
| オープンソースRDBMS | [PostgreSQL](https://github.com/postgres/postgres) | 14以上（本番17.7） | 空間データを含む各種データを格納するリレーショナルデータベース |
| 商用ライブラリ | [Mapbox GL](https://github.com/mapbox/mapbox-gl-js) | 3.16.0 | ベースマップタイル配信 |


## 6. 動作環境 
| 項目               | 最小動作環境                                                                                                                                                                                                                                                                                                                                    | 推奨動作環境                   | 
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | 
| OS                 | Microsoft Windows 10 以上　または macOS 12 Monterey 以上                                                                                                                                                                                                                                                                                                                  |  同左 | 
| CPU                | Pentium 4 以上                                                                                                                                                                                                                                                                                                                               | 同左              | 
| メモリ             | 8GB以上                                                                                                                                                                                                                                                                                                                                         | 同左                        |                  | 

## 7. 本リポジトリのフォルダ構成 
| フォルダ名                              | 詳細                   |
| ---------------------------------- | -------------------- |
| img                                | スクリーンショット    |
| .github/workflows | CI/CDワークフロー定義 |
| aws-infrastructure | フロントエンド・インフラ定義（Serverless Framework） |
| aws-rds | データベースインフラ定義（RDS / Secrets Manager） |
| public | 公開用静的ファイル |
| server | バックエンド（Node.js / Express） |
| server/assets/fonts | PDF出力用日本語フォント |
| server/config | DB・サーバー設定 |
| server/controllers | APIコントローラ |
| server/db/models | Sequelize ORMモデル |
| server/docs | DBスキーマ・ストアドプロシージャSQL定義 |
| server/helpers | エクスポートファイル生成ヘルパー |
| server/middlewares | 認証・エラーハンドリングミドルウェア |
| server/routes | APIルーティング定義 |
| server/services | ビジネスロジック・空間解析サービス |
| server/utils | 空間演算・レスポンス整形ユーティリティ |
| server/validators | 入力値バリデーション |
| src | フロントエンド（React / TypeScript） |
| src/api | APIクライアント（Axios） |
| src/assets | 静的アセット |
| src/components/AOI | AOI設定・統計表示コンポーネント |
| src/components/common | 共通UIコンポーネント |
| src/components/layout | ヘッダー・ナビゲーションコンポーネント |
| src/components/maps | 地図・凡例コンポーネント |
| src/components/result | 解析結果表示コンポーネント |
| src/components/utils | 汎用UIコンポーネント |
| src/config/layers | レイヤ表示・スタイル設定 |
| src/constants | 定数定義（地図・レイヤ・数値等） |
| src/context | Reactコンテキスト（ベースマップ・Socket・テーマ） |
| src/hooks | カスタムReact hooks |
| src/i18n | 多言語対応（日本語・英語） |
| src/layout | アプリ共通レイアウト |
| src/pages | 画面コンポーネント（プロジェクト一覧・AOI・結果） |
| src/redux | Redux Store・スライス定義 |
| src/routes | ルーティング・認証ガード |
| src/themes | MUIテーマ定義（ライト・ダーク） |
| src/types | TypeScript型定義 |
| src/utils | ユーティリティ（描画・ジオメトリ・地図・統計） |
| index.html | HTMLテンプレート |
| package.json | 依存ライブラリ定義 |
| sample.env | フロントエンド環境変数サンプル |
| vite.config.ts | Vite設定 |
| tsconfig.json | TypeScript設定 |


## 8. ライセンス

- ソースコード及び関連ドキュメントの著作権は国土交通省に帰属します。
- 本ドキュメントは[Project PLATEAUのサイトポリシー](https://www.mlit.go.jp/plateau/site-policy/)（CCBY4.0及び政府標準利用規約2.0）に従い提供されています。

## 9. 注意事項 

- 本リポジトリは参考資料として提供しているものです。動作保証は行っていません。
- 本リポジトリについては予告なく変更又は削除をする可能性があります。
- 本リポジトリの利用により生じた損失及び損害等について、国土交通省はいかなる責任も負わないものとします。

## 10. 参考資料
- 技術検証レポート: https://www.mlit.go.jp/plateau/file/libraries/doc/****.pdf
- PLATEAU WebサイトのUse caseページ「樹木データを活用した温熱環境シミュレータの開発」: https://www.mlit.go.jp/plateau/use-case/uc24-17/
