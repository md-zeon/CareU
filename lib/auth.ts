import { after } from "next/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, phoneNumber } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { emailSender } from "./provider/email";
import { prisma } from "./prisma";
import { sms } from "./provider/sms";

const emailOtpSubjects = {
  "sign-in": "Your sign-in code",
  "email-verification": "Verify your email",
  "forget-password": "Your password reset code",
  "change-email": "Confirm your new email",
} as const;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 300,
    },
  },
  rateLimit: {
    storage: "database",
    customRules: {
      "*/phone-number/send-otp": { window: 60, max: 3 },
      "*/phone-number/verify": { window: 60, max: 5 },
      "*/email-otp/send-verification-otp": { window: 60, max: 3 },
    },
  },
  advanced: {
    database: {
      joins: true,
    },
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip"],
    },
  },
  plugins: [
    phoneNumber({
      sendOTP: ({ phoneNumber, code }) => {
        after(sms.send(phoneNumber, `CareU verification code: ${code}`));
      },
      phoneNumberValidator: (value) => /^(\+880|0)1[3-9]\d{8}$/.test(value),
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => `${phoneNumber}@careu.phone`,
      },
    }),
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        after(
          emailSender.send(
            email,
            `CareU — ${emailOtpSubjects[type]}`,
            `Your CareU verification code: ${otp}`,
          ),
        );
      },
    }),
    nextCookies(),
  ],
});
