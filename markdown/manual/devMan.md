# 環境構築手順書

# 1 本書について

本書では、「生態系ネットワーク指標値算出機能」は優良緑地確保計画認定制度(TSUNAG)など国の制度との連携を想定し、国土交通省「都市における生物多様性指標（簡易版）」に基づき、指定したエリア内での生態系ネットワーク指標値を算出する機能を提供します。

本システムは、3D都市モデルを活用した樹木管理機能及び緑の効果の定量的評価を支援する取り組みである「樹木データを活用した温熱環境シミュレータの開発」の一部として開発されたWebアプリケーションです。

本システムの構成や仕様の詳細については以下も参考にしてください.

- [技術検証レポート](https://www.mlit.go.jp/plateau/file/libraries/doc/plateau_tech_doc_0136_ver01.pdf)

# 2 動作環境

本システムの動作環境は以下のとおりです。

## 2-1 サーバー（開発環境）

| 項目 | バージョン | 備考 |
| - | - | - |
| OS | Ubuntu 22.04 LTS / macOS 13以降 / Windows 11 (WSL2) | Linux 推奨 |
| Node.js | 18.x LTS 以上（CI/CDでは20.x使用） | フロントエンド・バックエンド共通 |
| npm | 9.x 以上 | Node.js に同梱 |
| PostgreSQL | 14 以上（本番環境は17.7） | PostGIS 3.x 必須 |
| Git | 2.30 以上 | |
| GDAL / ogr2ogr | 3.x 以上 | 空間データ投入時に使用（任意） |

## 2-2 クライアント（ブラウザ）

| ブラウザ | バージョン | 備考 |
| - | - | - |
| Google Chrome | 最新安定版 | 推奨 |
| Microsoft Edge | 最新安定版 | Chromium ベース |
| Mozilla Firefox | 最新安定版 | |
| Safari | 16 以上 | |

# 3 事前準備

本システムで利用する下記のソフトウェアおよびサービスを準備します。

（1）Node.js のインストール

[こちら](https://nodejs.org/)から Node.js（v18.x LTS 以上）をインストールします。nvm（Node Version Manager）を使ったインストールを推奨します。

（2）PostgreSQL / PostGIS のインストール

[こちら](https://www.postgresql.org/)から PostgreSQL（14 以上）をインストールしてサービスを起動します。その上で、位置情報を扱うための拡張機能である PostGIS をインストールします。インストール後、データベースおよびユーザーを作成してください。

（3）Mapbox アクセストークンの取得

[こちら](https://account.mapbox.com/)から Mapbox のアカウントを作成し、アクセストークンを取得します。無料プランでも利用可能です。

（4）Amazon S3 の準備（任意）

ファイルのアップロード・ダウンロード機能を使用する場合は、[こちら](https://aws.amazon.com/s3/)から AWS アカウントを取得し、本システムで使用するバケットを作成します。利用するデータサイズに応じたストレージクラスを選択してください。

# 4 インストール手順

（1）リポジトリの取得

[こちら](https://github.com/pacificspatial/green-econet)からリポジトリをクローンします。

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

`.env` ファイルは `.gitignore` で管理対象外となっています。誤ってGitにコミットしないよう注意してください。

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

（3）空間レイヤデータの投入

分析に使用する空間レイヤデータ（緑地ポリゴンおよび125mバッファ付き緑地）を `layers` スキーマのテーブルに投入します。レイヤデータ投入後、アプリケーション上でプロジェクトを作成してポリゴンを描画し、解析処理を実行すると `processing` スキーマ配下のテーブルにデータが自動的に生成されます。