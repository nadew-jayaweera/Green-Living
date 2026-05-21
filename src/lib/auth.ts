import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { firestore } from "@/lib/firebase-admin";
import bcrypt from "bcryptjs";

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

                const userSnapshot = await firestore
                    .collection("users")
                    .where("email", "==", credentials.email)
                    .limit(1)
                    .get();

                const user = userSnapshot.empty
                    ? null
                    : ({ id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() } as {
                        id: string;
                        email: string;
                        name: string;
                        image?: string;
                        role?: string;
                        password?: string;
                    });

                if (!user) {
                    throw new Error("No account found with this email");
                }

                if (!user.password) {
                    throw new Error("This account has no password set. Please reset your password.");
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
                    role: user.role ?? "USER",
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
    secret: process.env.NEXTAUTH_SECRET,
};
