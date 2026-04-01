export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username?: string;
  password?: string;
  fromEmail: string;
  fromName?: string;
  updatedAt: string;
}

export interface PublicSmtpConfig {
  host: string | null;
  port: number | null;
  secure: boolean;
  username: string | null;
  fromEmail: string | null;
  fromName: string | null;
  hasPassword: boolean;
  isConfigured: boolean;
  updatedAt: string | null;
}
