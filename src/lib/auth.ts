import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function resolveAuthSecret() {
    const configuredSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    if (configuredSecret) return configuredSecret;

    const fallbackSource = [process.env.DATABASE_URL, process.env.NEXTAUTH_URL, process.env.MAIN_ADMIN_EMAIL]
        .filter(Boolean)
        .join("|");

    return crypto
        .createHash("sha256")
        .update(`green-living-nextauth:${fallbackSource}`)
        .digest("hex");
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Please provide email and password");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    throw new Error("No account found with this email");
                }

                if (user.suspended) {
                    throw new Error("Your account has been suspended. Please contact support.");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Invalid password");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role: user.role,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.name = user.name;
                token.email = user.email;
                token.image = user.image;
            }

            if (trigger === "update" && session?.user) {
                token.name = session.user.name;
                token.image = session.user.image;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id as string;
                (session.user as any).role = token.role as string;
                session.user.name = token.name as string | undefined;
                session.user.email = token.email as string | undefined;
                session.user.image = token.image as string | undefined;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: resolveAuthSecret(),
};
