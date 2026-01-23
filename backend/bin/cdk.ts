#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib';

const app = new cdk.App();
new CdkStack(app, "SyllexAPI", {
  env: {
    region: 'eu-south-1'
  }
});