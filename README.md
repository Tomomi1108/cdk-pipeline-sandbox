# cdk-pipeline-sandbox

CDK + GitHub Actions + OIDC の学習・検証用リポジトリ。  

## 構成概要

- **題材**: S3バケット + SSM Parameter（ダミーリソース）
- **環境分離**: 1アカウント内で `dev-SandboxStack` / `prod-SandboxStack` を分離
- **認証**: GitHub Actions OIDC（アクセスキー不要）
- **デプロイ戦略**: Build Once, Deploy Many（`cdk.out/` をアーティファクト昇格）

## 学習フェーズ

| Phase | 内容 | ポイント |
|-------|------|---------|
| 1 | CDK基礎（ローカル） | `cdk synth` / `cdk deploy` / `cdk.out/` の構造理解 |
| 2 | GitHub Actions + OIDC | アクセスキー不要でAWSに繋ぐ仕組み |
| 3 | Build Once, Deploy Many | `--app cdk.out/` で再synthなしに昇格デプロイ |
| 4 | パラメータ管理 | CDK context / GitHub Secrets+Variables / SSM の使い分け |

## セットアップ手順

### 1. AWSの事前準備

```bash
# CDK bootstrap（初回のみ）
cd infra
npm install
npx cdk bootstrap aws://YOUR_ACCOUNT_ID/ap-northeast-1
```

AWSコンソールで以下を作成：
- **OIDC Provider**: `https://token.actions.githubusercontent.com`（Audience: `sts.amazonaws.com`）
- **IAM Role**: Trust Policy に下記を設定（`YOUR_GITHUB_USERNAME` を置き換える）

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringLike": {
        "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/cdk-pipeline-sandbox:*"
      },
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
      }
    }
  }]
}
```

> 学習目的のため `AdministratorAccess` を付与（本番では絶対にNG）

### 2. GitHub リポジトリの設定

**Repository Secrets**:
- `IAM_ROLE_ARN` — 上記で作ったIAMロールのARN

**Repository Variables**:
- `AWS_ACCOUNT_ID` — AWSアカウントID
- `AWS_REGION` — `ap-northeast-1`

**Environments**（Settings > Environments で作成）:
- `beta` — 保護ルールなし（devデプロイに使用）
- `production` — Required Reviewers に自分を追加（手動承認ゲート）

### 3. ローカル動作確認（Phase 1）

```bash
cd infra
npm install
npx cdk synth             # cdk.out/ が生成されることを確認
npx cdk deploy dev-SandboxStack
npx cdk diff dev-SandboxStack   # コード変更後の差分確認
npx cdk destroy dev-SandboxStack
```

## パラメータ管理の3パターン

| パターン | 格納場所 | 用途 | 限界 |
|----------|---------|------|------|
| A | `cdk.json` の `context` | インフラ構造を決める設定（バケット名等） | 秘密情報を置けない |
| B | GitHub Secrets/Variables（Environment スコープ） | 認証情報・デプロイ先識別子 | CDKコード内から直接参照不可 |
| C | SSM Parameter Store | クロススタック参照・ランタイム設定 | デプロイ後に参照可能になる |
