import { Construct } from "constructs";
import * as fs from "fs";
import * as path from "path";
import { Role } from "aws-cdk-lib/aws-iam";

const getAllFiles = (dir: string): string[] => {
  return fs.readdirSync(dir).flatMap((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      return getAllFiles(fullPath);
    } else if (file.endsWith(".ts")) {
      return [fullPath];
    } else {
      return [];
    }
  });
};

export const getFunctionDetails = (): {
  path: string;
  functionName: string;
}[] => {
  const functionsDir = "src/functions";
  const files = getAllFiles(functionsDir);
  if (files.length !== [...new Set(files)].length) {
    throw new Error("Hai funzioni duplicate");
  }
  const functionDetails: { path: string; functionName: string }[] = files.map(
    (file) => ({
      path: file,
      functionName: path.basename(file, ".ts"),
    })
  );
  return functionDetails;
};
