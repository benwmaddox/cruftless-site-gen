declare module "../scripts/deploy-lib.mjs" {
  export const buildBackupObjectKey: (...args: any[]) => any;
  export const buildLiveObjectKey: (...args: any[]) => any;
  export const detectCacheControl: (...args: any[]) => any;
  export const isDnsSafeSlug: (...args: any[]) => any;
  export const normalizeDeployConfig: (...args: any[]) => any;
  export const shouldExcludeFromBackup: (...args: any[]) => any;
  export const toSafeTimestamp: (...args: any[]) => any;
}

declare module "../deploy/worker/src/index.mjs" {
  const worker: any;
  export default worker;
}

declare module "../deploy/worker/src/routing.mjs" {
  export const buildCandidateKeys: (...args: any[]) => any;
  export const getSlugFromHostname: (...args: any[]) => any;
}
