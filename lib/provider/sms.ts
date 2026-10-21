export interface SmsProvider {
  send(to: string, message: string): Promise<void>;
}

const consoleSmsProvider: SmsProvider = {
  async send(to, message) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Console SMS stub refused in production. Configure a real provider in lib/provider/sms.ts.",
      );
    }
    console.log(`[sms:console] to=${to} message="${message}"`);
  },
};

export const sms: SmsProvider = consoleSmsProvider;
