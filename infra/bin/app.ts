#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SandboxStack } from '../lib/sandbox-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-1',
};

// 同一アカウント内で dev / prod を 2 スタックとして展開する
// マルチアカウント構成を、スタック名プレフィックスで擬似的に再現している
new SandboxStack(app, 'dev-SandboxStack', { env, envName: 'dev' });
new SandboxStack(app, 'prod-SandboxStack', { env, envName: 'prod' });
