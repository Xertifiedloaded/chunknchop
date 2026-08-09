export type VerifySuccess = {
  status: 'success';
  reference: string;
  orderId: string;
  total: number;
  paidAt?: string;
  channel?: string;
};

export type VerifyFailed = {
  status: 'failed';
  reference: string;
  orderId?: string;
  message: string;
};

export type VerifyError = {
  status: 'error';
  message: string;
};

export type VerifyResult = VerifySuccess | VerifyFailed | VerifyError;
