export type EnvName = 'dev' | 'prod';

export interface EnvConfig {
  bucketName: string;
  ssmPrefix: string;
}

export function getConfig(node: { tryGetContext: (key: string) => unknown }, envName: EnvName): EnvConfig {
  const environments = node.tryGetContext('environments') as Record<EnvName, EnvConfig>;
  const config = environments?.[envName];
  if (!config) {
    throw new Error(`No config found for environment: ${envName}`);
  }
  return config;
}
