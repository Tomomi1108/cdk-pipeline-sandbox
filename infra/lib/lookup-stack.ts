import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class LookupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const appName = ssm.StringParameter.valueFromLookup(
      this,
      '/sandbox/dev/app-name'
    );

    new cdk.CfnOutput(this, 'LookedUpAppName', { value: appName });
  }
}
