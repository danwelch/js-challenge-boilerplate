export interface SubmitResult {
  status: 'success' | 'error';
  message: string;
  id?: number;
}
