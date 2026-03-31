#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib';
import { AWS_REGION, STACK_NAME } from '../environment';

const app = new cdk.App();
new CdkStack(app, STACK_NAME, {
  env: {
    region: AWS_REGION
  }
});