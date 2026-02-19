# 温熱環境シミュレーション機能

![概要](./img/greendashboard_001.png)

## 更新履歴
| 更新日時 | リリース | 更新内容 |
|-------------|--------------|----------------------------------------------|
| 2026/3/** | 1st Release | 初版リリース |


## 1. 概要
本リポジトリでは、2025年度のProject PLATEAUで開発した「樹木データを活用した温熱環境シミュレータの開発」温熱環境シミュレーション機能のソースコードを公開しています。

本機能は、PLATEAUの3D都市モデルおよび樹木データを活用し、任意の環境条件（気温・湿度・風速・風向き・各面温度）を入力することで、対象エリアの温熱環境（気温・湿度・WBGT等）を数値流体計算（CFD）によりシミュレートするWebアプリケーションです。バックエンドの流体計算エンジンとして [OpenFOAM v2506](https://www.openfoam.com/news/main-news/openfoam-v2506) を使用しており、樹木の影響を組み込む植生キャノピーモデル（`canopyModels_v2506`）を同梱しています。

本システムの詳細については[技術検証レポート](https://www.mlit.go.jp/plateau/file/libraries/doc/*****)を参照してください。

## 2. 「温熱環境シミュレーション機能」について
本機能は、地方公共団体や民間企業等が樹木・緑地データを活用して都市の温熱環境を把握・改善するための意思決定支援ツールです。

本システムの詳細については[技術検証レポート](https://www.mlit.go.jp/plateau/file/libraries/doc/*****)を参照してください。

## 3. 利用手順
本システムの構築手順及び利用手順については[利用チュートリアル](https://project-plateau.github.io/green-dashboard)を参照してください。

## 4. システム概要
### 【シミュレーションプロジェクト管理】
#### ①プロジェクト一覧
- 作成済みのシミュレーションプロジェクトを一覧表示します
- 各プロジェクトの処理ステータス（処理待機中・処理中・完了）を確認できます

#### ②プロジェクト設定・シミュレーション実行
- 地図上でシミュレーション対象領域をポリゴンで指定します
- 以下の環境条件を入力してシミュレーションを実行します
  - 環境設定：気温（°C）・湿度（%）・風速（m/s）・風向き（北/東/南/西）
  - 表面温度設定：ビル壁面・地面・道路・水面

### 【シミュレーション結果の表示】
#### ①結果レポート
- 地面温度分布
- 高さ1.2mの気温分布
- 高さ1.2mの湿度分布
- WBGT（暑さ指数）分布
- 3Dビュー（CesiumJS）による立体表示


## 5. 利用技術

| 種別 | 名称 | バージョン | 内容 |
| --- | --- | --- | --- |
| オープンソースソフトウェア | [Apache HTTP Server](https://httpd.apache.org/) | 2.4.58 | Webアプリで配信を行うためのWebサーバソフトウェア |
| オープンソースソフトウェア | [PostGIS](https://github.com/postgis/postgis) | 3.4.1 | PostgreSQLで位置情報を扱うことを可能とする拡張機能 |
| オープンソースソフトウェア | [OpenFOAM](https://www.openfoam.com/) | v2506 | オープンソースの数値流体計算（CFD）ソフトウェア。温熱環境シミュレーションの計算エンジン |
| オープンソースライブラリ | [CesiumJS](https://github.com/CesiumGS/cesium) | 1.136 | 3Dビューワ上にデータを描画するためのライブラリ |
| オープンソースライブラリ | [React.js](https://github.com/facebook/react/releases) | 19.x | JavaScriptのフレームワーク内で機能するUIを構築するためのライブラリ |
| オープンソースライブラリ | [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) | 5.x | ブラウザ上で地図を表示するためのライブラリ |
| オープンソースライブラリ | [MUI（Material UI）](https://mui.com/) | 7.x | ReactのUIコンポーネントライブラリ |
| オープンソースRDBMS | [PostgreSQL](https://github.com/postgres/postgres) | 16.2 | 各種配信するデータを格納するリレーショナルデータベース |
| 商用ソフトウェア | [Cesium ion](https://cesium.com/platform/cesium-ion/) | - | 3Dデータの変換と配信のクラウドサービス |
| クラウドサービス | [Firebase](https://firebase.google.com/) | - | 認証機能を提供するクラウドサービス |


## 6. 動作環境
| 項目               | 最小動作環境                                              | 推奨動作環境 |
| ------------------ | --------------------------------------------------------- | ------------ |
| OS                 | Microsoft Windows 10 以上　または macOS 12 Monterey 以上 | 同左         |
| CPU                | Pentium 4 以上                                            | 同左         |
| メモリ             | 8GB以上                                                   | 同左         |

OpenFOAM によるシミュレーション計算サーバの動作環境は以下のとおりです。

| 項目 | 動作環境 |
| --- | --- |
| OS | Linux 64bit |
| ソフトウェア | OpenFOAM v2506 |

## 7. 本リポジトリのフォルダ構成
| フォルダ/ファイル名                | 詳細                                           |
| ---------------------------------- | ---------------------------------------------- |
| public                             | 公開用静的ファイル                             |
| public/favicon.png                 | favicon画像                                    |
| src                                | アプリケーションソース                         |
| src/App.jsx                        | ルートコンポーネント                           |
| src/main.jsx                       | エントリーポイント                             |
| src/main.css                       | 全体スタイル                                   |
| src/core.jsx                       | アプリコア処理（難読化済み）                   |
| src/components                     | 共通UIコンポーネント                           |
| src/components/maplibre            | MapLibre描画UI                                 |
| src/manager                        | APIユーティリティ                              |
| src/map                            | 地図描画処理                                   |
| src/map/cesium                     | Cesiumレイヤ処理                               |
| src/map/mapbox                     | Mapboxレイヤ処理                               |
| src/map/styles                     | 地図スタイル定義                               |
| src/resources                      | 静的リソース                                   |
| src/resources/fonts                | フォント                                       |
| src/resources/map_style            | MapスタイルJSON                                |
| src/views                          | 画面UI                                         |
| src/views/auth.jsx                 | 認証画面                                       |
| src/views/login.jsx                | ログイン画面                                   |
| src/views/header.jsx               | ヘッダーUI                                     |
| src/views/main                     | メイン画面UI（プロジェクト一覧・レポート）     |
| src/views/project                  | プロジェクト設定・地図・入力フォームUI         |
| index.html                         | HTMLテンプレート                               |
| package.json                       | 依存ライブラリ定義                             |
| vite.config.js                     | Vite設定                                       |
| tsconfig.json                      | TypeScript設定                                 |
| canopyModels_v2506_tar.gz          | OpenFOAM用植生キャノピーモデルソースコード     |


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
- OpenFOAM v2506: https://www.openfoam.com/news/main-news/openfoam-v2506
