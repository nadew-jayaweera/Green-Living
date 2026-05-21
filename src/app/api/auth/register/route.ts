import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

export async function POST(request: Request) {
    try {
        const { name, email, password } = await request.json();

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Name, email, and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await firestore
            .collection("users")
            .where("email", "==", email)
            .limit(1)
            .get();

        if (!existingUser.empty) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 400 }
            );
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 12);
        const userId = randomUUID();
        await firestore.collection("users").doc(userId).set({
                name,
                email,
                password: hashedPassword,
                role: "USER",
                suspended: false,
                createdAt: new Date().toISOString(),
        });

        return NextResponse.json(
            { message: "Account created successfully", userId },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
