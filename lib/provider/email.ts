export interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<void>;
}

const consoleEmailProvider: EmailProvider = {
  async send(to, subject, body) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Console email stub refused in production. Configure a real provider in lib/provider/email.ts.",
      );
    }
    console.log(`[email:console] to=${to} subject="${subject}" body="${body}"`);
  },
};

export const emailSender: EmailProvider = consoleEmailProvider;
