export interface PublicSmtpConfig {
  id: string | null;
  host: string | null;
  port: number | null;
  secure: boolean;
  username: string | null;
  fromEmail: string | null;
  fromName: string | null;
  hasPassword: boolean;
  updatedAt: string | null;
}

export interface DecryptedSmtpConfig {
  id: string;
  tenantId: string;
  host: string;
  port: number;
  secure: boolean;
  username: string | null;
  password: string | null;
  fromEmail: string;
  fromName: string | null;
  updatedAt: string;
}
