# 環境構築手順書

# 1 本書について

本書では、生態系ネットワーク解析機能（以下「本システム」という。）の開発環境構築手順について記載しています。本システムの構成や仕様の詳細については以下も参考にしてください。

[技術検証レポート](www.mlit.go.jp/plateau/file/libraries/doc/)

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

MapLibre GL を使用した地図描画に WebGL 2.0 が必要です。GPU ドライバを最新の状態に保ち、ブラウザの WebGL が有効であることを確認してください。

## 2-3 AWSサービス構成（本番・ステージング環境）

本番・ステージング環境は以下のAWSサービスで構成されています。ローカル開発ではAWS環境は必須ではありませんが、S3連携機能を使用する場合はバケットとIAMキーの準備が必要です。

| AWSサービス | 用途 |
| - | - |
| Amazon RDS (PostgreSQL 17) | 本番データベース（PostGIS拡張） |
| Amazon EC2 | バックエンド（Node.js / PM2）ホスティング |
| Amazon S3 | フロントエンド静的ファイル配信・ファイルアップロード |
| Amazon CloudFront | S3 CDN配信 |
| Amazon Cognito | ユーザー認証（JWT発行） |
| AWS Secrets Manager | DB認証情報管理 |

# 3 事前準備

## 3-1 必要ツールの確認

以下のコマンドで各ツールのバージョンを確認します。

```bash
node --version    # v18.x 以上
npm --version     # 9.x 以上
git --version     # 2.30 以上
psql --version    # PostgreSQL 14 以上
```

## 3-2 Node.js のインストール

nvm（Node Version Manager）を使ったインストールを推奨します。

```bash
# nvm のインストール（未インストールの場合）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Node.js 20 LTS のインストールと有効化
nvm install 20
nvm use 20
nvm alias default 20

node --version   # v20.x.x が表示されること
```

## 3-3 PostgreSQL / PostGIS のインストール

### Ubuntu 22.04 の場合

```bash
# PostgreSQL 公式リポジトリの追加
sudo apt-get install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh

# PostgreSQL 17 と PostGIS のインストール
sudo apt-get install -y postgresql-17 postgresql-17-postgis-3

# サービスの起動と自動起動設定
sudo systemctl start postgresql
sudo systemctl enable postgresql
psql --version
```

### macOS の場合（Homebrew）

```bash
brew install postgresql@17 postgis

# PATH の設定
echo 'export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# サービスの起動
brew services start postgresql@17
```

### データベースとユーザーの作成

```bash
sudo -u postgres psql
```

```sql
CREATE USER georoot WITH PASSWORD 'your_password';
CREATE DATABASE green_econet OWNER georoot;
\c green_econet
GRANT ALL PRIVILEGES ON DATABASE green_econet TO georoot;
\q
```

## 3-4 Mapbox アクセストークンの取得

フロントエンドはMapLibre GLをMapbox GL互換モードで使用しています（`vite.config.ts` にて `mapbox-gl` → `maplibre-gl` エイリアス設定済）。地図タイルの表示にMapboxアクセストークンが必要です。

| サービス | 環境変数名 | 用途 | 取得先 |
| - | - | - | - |
| Mapbox | `VITE_MAPBOX_TOKEN` | ベースマップタイル配信 | https://account.mapbox.com/（無料プランあり） |
| AWS S3 | `AWS_ACCESS_KEY_ID` 等 | ファイルアップロード・ダウンロード | AWSコンソールでバケットとIAMキーを作成 |

ローカル開発でS3連携を使わない場合、AWS関連の環境変数は未設定でも地図表示・ポリゴン描画・DB保存の基本機能を確認できます。

# 4 インストール手順

## 4-1 リポジトリの取得

```bash
git clone https://github.com/pacificspatial/green-econet.git
cd green-econet
```

## 4-2 環境変数の設定

リポジトリには `sample.env`（フロントエンド用）と `server/sample.env`（バックエンド用）が用意されています。それぞれをコピーして `.env` を作成し、必要な値を設定します。

### フロントエンド用 .env（リポジトリルート）

```bash
cp sample.env .env
```

`.env` を開き、以下の値を設定します。

```
VITE_PORT=3000
VITE_MAPBOX_TOKEN=pk.eyJ1Ijoixxxxxxxx...     # Mapbox アクセストークン

VITE_BACKEND_URL=http://localhost:4000/       # バックエンド API の URL
VITE_EP_SOCKET_PORT=http://localhost:4000     # Socket.IO 接続先
```

`VITE_` プレフィックスが付いた変数のみViteによってフロントエンドに公開されます。機密情報を `VITE_` 付きで設定しないよう注意してください。

### バックエンド用 .env（server/ ディレクトリ）

```bash
cp server/sample.env server/.env
```

`server/.env` を開き、以下の値を設定します。

```
# サーバー基本設定
PORT=4000
NODE_ENV=development

# API 認証（Basic認証パスワード）
AUTH_PASS=your_api_password_here

# フロントエンドの CORS 許可 URL
FRONT_END_URL=http://localhost:3000

# PostgreSQL 接続設定
DB_USER=georoot
DB_HOST=localhost
DB_NAME=green_econet
DB_PASSWORD=your_db_password_here
DB_PORT=5432
DB_DATABASE=green_econet

# JWT シークレット（ローカル開発用）
JWT_SECRET=your_local_jwt_secret_here

# AWS S3（S3連携機能を使用する場合のみ設定）
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=your-bucket-name
```

`AUTH_PASS` はバックエンドAPIへのBasic認証パスワードです。フロントエンドからのAPIリクエストはすべてこのパスワードで認証されます。ローカル開発でも必ず設定してください。未設定の場合、APIが401エラーを返します。

ローカルのPostgreSQLではSSL接続が不要な場合があります。接続エラーが発生する場合は `server/config/dbConfig.js` の `ssl: { require: true }` を `false` に変更してください。

`.env` ファイルは `.gitignore` で管理対象外となっています。誤ってGitにコミットしないよう注意してください。

## 4-3 フロントエンドのセットアップ

リポジトリルートで依存パッケージをインストールします。

```bash
npm install
```

フロントエンド単体で起動する場合は以下を実行します。

```bash
npm run start
```

ブラウザで `http://localhost:3000` にアクセスして画面が表示されることを確認します。

## 4-4 バックエンドのセットアップ

`server/` ディレクトリで依存パッケージをインストールします。

```bash
cd server
npm install
```

バックエンドサーバーを起動します。

```bash
# 開発モード（nodemon でファイル変更を自動検知）
npm run monitor

# または通常起動
npm run start
```

別ターミナルから `/ping` エンドポイントにアクセスし、起動を確認します。

```bash
curl http://localhost:4000/ping
# → pong  が返ってくれば正常起動
```

## 4-5 フロントエンド・バックエンドの同時起動

ルートの `package.json` には `concurrently` を使った同時起動スクリプトが定義されています。通常の開発はこちらを使用します。

```bash
# リポジトリルートで実行
npm run dev
```

これにより以下が同時起動します。

- フロントエンド（Vite HMR）：`http://localhost:3000`
- バックエンド（nodemon）：`http://localhost:4000`

ポート競合が発生する場合は、`vite.config.ts` の `server.port`（デフォルト3000）と `server/.env` の `PORT`（デフォルト4000）が他のプロセスで使用されていないか確認してください。

# 5 初期データの投入

データベースにテーブル・スキーマ・ストアドプロシージャを作成し、空間分析に必要な静的レイヤデータを投入します。

## 5-1 スキーマ・テーブルの作成

DDLファイル `server/docs/econet_plateau_schema.sql` を実行します。このファイルは以下を行います。

- PostgreSQL拡張（`postgis`、`uuid-ossp`）の有効化
- `layers` スキーマ・`processing` スキーマの作成
- 全テーブルおよび空間インデックスの作成

```bash
psql -U georoot -d green_econet -f server/docs/econet_plateau_schema.sql
```

作成されるテーブルの一覧は以下のとおりです。

| スキーマ | テーブル | 説明 |
| - | - | - |
| `public` | `projects` | プロジェクト管理（AOIジオメトリ・解析結果インデックスを含む） |
| `public` | `project_polygons` | ユーザーが描画したポリゴン（プロジェクトあたり最大5件） |
| `layers` | `enp_green` | 静的グリーンレイヤ（緑地ポリゴン） |
| `layers` | `enp_buffer125_green` | 125mバッファ付きグリーンレイヤ |
| `processing` | `clipped_green` | プロジェクト別にクリップされた緑地 |
| `processing` | `clipped_buffer125_green` | プロジェクト別にクリップされたバッファ緑地 |
| `processing` | `merged_green` | ユーザーポリゴン＋クリップ緑地のマージ結果 |
| `processing` | `buffer125_merged_green` | マージ緑地から生成した125mバッファ（UID付き） |
| `processing` | `clipped_green_joined` | クリップ緑地とバッファのジョイン結果 |
| `processing` | `merged_green_joined` | マージ緑地とバッファのジョイン結果 |

作成結果を確認します。

```sql
-- スキーマの確認
\dn
-- → public / layers / processing が一覧に表示されること

-- テーブルの確認
\dt public.*
\dt layers.*
\dt processing.*
```

## 5-2 ストアドプロシージャの登録

空間処理（AOI生成・クリッピング・バッファ処理・UIDジョインなど）はPostgreSQLのストアドプロシージャで実装されています。`server/docs/sql_stored_procedures.sql` を実行して登録します。

```bash
psql -U georoot -d green_econet -f server/docs/sql_stored_procedures.sql
```

登録されたプロシージャを確認します。

```sql
\df processing.*
-- 以下の関数が表示されることを確認する
-- processing.set_aoi              … AOI（1000mバッファ）の計算・更新
-- processing.clip_green           … 緑地レイヤをAOIでクリップ
-- processing.clip_buffer125_green … バッファ緑地をAOIでクリップ
```

## 5-3 空間レイヤデータの投入

分析に使用する空間レイヤデータを `layers` スキーマのテーブルに投入します。

| テーブル | 元データ（例） | ジオメトリ型 | 座標系 |
| - | - | - | - |
| `layers.enp_green` | `green.parquet`（緑地ポリゴン） | MULTIPOLYGON | EPSG:4326 |
| `layers.enp_buffer125_green` | `buffer125_green.parquet`（125mバッファ付き緑地） | MULTIPOLYGON | EPSG:4326 |

元データ（Parquetファイル等）はリポジトリには含まれていません。プロジェクト担当者またはデータ管理者から入手してください。

### 方法A：GeoJSON から投入する（ogr2ogr 使用）

```bash
# ogr2ogr のインストール（GDAL に含まれる）
sudo apt-get install -y gdal-bin    # Ubuntu
brew install gdal                   # macOS

# GeoJSON → layers.enp_green に投入
ogr2ogr \
  -f "PostgreSQL" \
  PG:"host=localhost port=5432 dbname=green_econet user=georoot password=your_password" \
  green.geojson \
  -nln layers.enp_green \
  -nlt MULTIPOLYGON \
  -t_srs EPSG:4326 \
  -overwrite

# GeoJSON → layers.enp_buffer125_green に投入
ogr2ogr \
  -f "PostgreSQL" \
  PG:"host=localhost port=5432 dbname=green_econet user=georoot password=your_password" \
  buffer125_green.geojson \
  -nln layers.enp_buffer125_green \
  -nlt MULTIPOLYGON \
  -t_srs EPSG:4326 \
  -overwrite
```

### 方法B：GeoParquet から投入する（Python / GeoPandas 使用）

```bash
# 必要ライブラリのインストール
pip install geopandas pyarrow sqlalchemy psycopg2-binary
```

```python
import geopandas as gpd
from sqlalchemy import create_engine

engine = create_engine(
    "postgresql://georoot:your_password@localhost:5432/green_econet"
)

# layers.enp_green へ投入
gdf_green = gpd.read_parquet("green.parquet")
gdf_green = gdf_green.set_crs(epsg=4326)
gdf_green.to_postgis("enp_green", engine, schema="layers", if_exists="replace")

# layers.enp_buffer125_green へ投入
gdf_buf = gpd.read_parquet("buffer125_green.parquet")
gdf_buf = gdf_buf.set_crs(epsg=4326)
gdf_buf.to_postgis("enp_buffer125_green", engine, schema="layers", if_exists="replace")

print("レイヤデータの投入が完了しました")
```

### 投入結果の確認

```sql
-- レコード件数の確認
SELECT COUNT(*) FROM layers.enp_green;
SELECT COUNT(*) FROM layers.enp_buffer125_green;

-- ジオメトリの確認（座標系がEPSG:4326であること）
SELECT ST_SRID(geom), ST_GeometryType(geom)
FROM layers.enp_green
LIMIT 1;
```

レイヤデータ投入後、アプリケーション上でプロジェクトを作成してポリゴンを描画し、解析処理を実行すると `processing` スキーマ配下のテーブル（`clipped_green`、`merged_green` 等）にデータが自動的に生成されます。
