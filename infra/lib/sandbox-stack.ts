import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { EnvName, getConfig } from './config';

export interface SandboxStackProps extends cdk.StackProps {
  envName: EnvName;
}

export class SandboxStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SandboxStackProps) {
    super(scope, id, props);

    const envName = (process.env.ENV_NAME ?? props.envName) as EnvName;
    const config = getConfig(this.node, envName);

    // S3バケット（検証用ダミーリソース）
    // removalPolicy: DESTROY + autoDeleteObjects で cdk destroy 時に完全削除できる
    const bucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `${config.bucketName}-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
    });

    // SSM Parameter（検証用。環境ごとに異なるパスに配置）
    new ssm.StringParameter(this, 'AppNameParam', {
      parameterName: `${config.ssmPrefix}/app-name`,
      stringValue: `sandbox-${props.envName}`,
    });

    new ssm.StringParameter(this, 'BucketArnParam', {
      parameterName: `${config.ssmPrefix}/artifact-bucket-arn`,
      stringValue: bucket.bucketArn,
    });

    // CDK Output（コンソールとActionsログで確認しやすくする）
    new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
    new cdk.CfnOutput(this, 'Environment', { value: props.envName });
  }
}
