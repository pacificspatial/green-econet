# 環境構築手順書

# 1 本書について

本書では、「生態系ネットワーク指標値算出機能」は優良緑地確保計画認定制度(TSUNAG)など国の制度との連携を想定し、国土交通省「都市における生物多様性指標（簡易版）」に基づき、指定したエリア内での生態系ネットワーク指標値を算出する機能を提供します。

本システムは、Project PLATEAUの令和7年度のユースケース開発業務の一部であるUC25-11「樹木データを活用した温熱環境シミュレータの開発」で開発されたWebアプリケーションです。

# 2 動作環境

| 項目 | 最小動作環境 | 推奨動作環境 |
| --- | --- | --- |
| OS | Amazon Linux 2023 以上（AWS EC2） | 同左 |
| CPU | EC2 インスタンスタイプに依存 | 同左 |
| メモリ | EC2 インスタンスタイプに依存（4GB 以上） | 同左 |
| ストレージ | AWS S3 | 同左 |

クライアント（ブラウザ）の動作環境は以下のとおりです。

| 項目 | 動作環境 |
| --- | --- |
| ブラウザ | Google Chrome 最新版 |

本システムで使用するソフトウェアおよびサービスの一覧は以下のとおりです。

| 種別 | 名称 | バージョン | 内容 |
| --- | --- | --- | --- |
| オープンソースソフトウェア | [PostGIS](https://github.com/postgis/postgis) | 3.x | PostgreSQLで位置情報を扱うことを可能とする拡張機能 |
| オープンソースRDBMS | [PostgreSQL](https://github.com/postgres/postgres) | 14以上（本番17.7） | 空間データを含む各種データを格納するリレーショナルデータベース |
| 商用ライブラリ | [MapboxGL JS](https://github.com/mapbox/mapbox-gl-js) | 3.16.0 | ベースマップタイル配信 |


# 3 事前準備

本システムで利用する下記のソフトウェアおよびサービスを準備します。

（1）Node.js のインストール

[こちら](https://nodejs.org/)から Node.js（v18.x LTS 以上）をインストールします。nvm（Node Version Manager）を使ったインストールを推奨します。

（2）PostgreSQL / PostGIS のインストール

[こちら](https://www.postgresql.org/)から PostgreSQL（14 以上）をインストールしてサービスを起動します。その上で、位置情報を扱うための拡張機能である PostGIS をインストールします。インストール後、データベースおよびユーザーを作成してください。

（3）Mapbox アクセストークンの取得

[こちら](https://account.mapbox.com/)から Mapbox のアカウントを作成し、アクセストークンを取得します。無料プランでも利用可能です。

（4）Amazon S3 の準備

ファイルのダウンロード機能を使用する場合は、[こちら](https://aws.amazon.com/s3/)から AWS アカウントを取得し、本システムで使用するバケットを作成します。

# 4 インストール手順

（1）リポジトリの取得

[こちら](https://github.com/pacificspatial/green-econet)からソースコードをダウンロードします。

（2）環境変数の設定

リポジトリには `sample.env`（フロントエンド用）と `server/sample.env`（バックエンド用）が用意されています。それぞれをコピーして `.env` を作成し、以下の値を設定します。

フロントエンド用（リポジトリルート）：

```
VITE_PORT=3000
VITE_MAPBOX_TOKEN=<Mapbox アクセストークン>
VITE_BACKEND_URL=<バックエンド API の URL>
VITE_EP_SOCKET_PORT=<Socket.IO 接続先>
```

バックエンド用（`server/` ディレクトリ）：

```
PORT=4000
NODE_ENV=development
AUTH_PASS=<API 認証パスワード>
FRONT_END_URL=<フロントエンドの URL>
DB_USER=<DBユーザー名>
DB_HOST=<DBホスト>
DB_NAME=<DB名>
DB_PASSWORD=<DBパスワード>
DB_PORT=5432
JWT_SECRET=<JWTシークレット>
AWS_REGION=<AWSリージョン>（S3使用時のみ）
AWS_ACCESS_KEY_ID=<AWSアクセスキー>（S3使用時のみ）
AWS_SECRET_ACCESS_KEY=<AWSシークレットキー>（S3使用時のみ）
S3_BUCKET_NAME=<S3バケット名>（S3使用時のみ）
```

（3）フロントエンドのセットアップ

リポジトリルートで依存パッケージをインストールし、サーバーを起動します。

```bash
npm install
npm run start
```

（4）バックエンドのセットアップ

`server/` ディレクトリで依存パッケージをインストールし、サーバーを起動します。

```bash
cd server
npm install
npm run start
```

（5）フロントエンド・バックエンドの同時起動

通常の開発では、リポジトリルートで以下のコマンドを実行することでフロントエンドとバックエンドを同時に起動できます。

```bash
npm run dev
```

# 5 初期データの投入

データベースにテーブル・スキーマ・ストアドプロシージャを作成し、空間分析に必要な静的レイヤデータを投入します。

（1）スキーマ・テーブルの作成

`server/docs/econet_plateau_schema.sql` を実行してテーブルおよび空間インデックスを作成します。

```bash
psql -U georoot -d green_econet -f server/docs/econet_plateau_schema.sql
```

（2）ストアドプロシージャの登録

`server/docs/sql_stored_procedures.sql` を実行してストアドプロシージャを登録します。

```bash
psql -U georoot -d green_econet -f server/docs/sql_stored_procedures.sql
```

（3）緑地データの投入

分析に使用する緑地データ（JAXA土地利用被覆図の緑地ポリゴン）を `layers` スキーマのテーブルに投入します。レイヤデータ投入後、アプリケーション上でプロジェクトを作成してポリゴンを描画し、解析処理を実行すると `processing` スキーマ配下のテーブルにデータが自動的に生成されます。