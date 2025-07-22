export type ActionResponse<T = any> = {
  data: T | null;
  error: any;
} | undefined;
