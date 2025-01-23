import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from './otp.schema';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
    constructor(
        @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
        private configService: ConfigService,
    ) { }

    private generateOTP(length: number = 6): string {
        return crypto.randomInt(100000, 999999).toString();
    }

    async createOTP(email: string, type: 'RESET_PASSWORD' | 'EMAIL_VERIFICATION'): Promise<{ otp: string | null; shouldSendEmail: boolean }> {
        const recentOTP = await this.otpModel.findOne({
            email,
            type,
            isUsed: false,
            expiresAt: { $gt: new Date() },
            createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) }
        });

        if (recentOTP) {
            // Return null OTP and false flag if recent OTP exists
            return { otp: null, shouldSendEmail: false };
        }

        // Invalidate any existing OTP for this email and type
        await this.otpModel.updateMany(
            { email, type, isUsed: false },
            { isUsed: true }
        );

        // Generate new OTP
        const otp = this.generateOTP();

        // Create new OTP record
        await this.otpModel.create({
            email,
            otp,
            type,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        });

        return { otp, shouldSendEmail: true };
    }

    async verifyOTP(email: string, otp: string, type: 'RESET_PASSWORD' | 'EMAIL_VERIFICATION') {
        const otpRecord = await this.otpModel.findOne({
            email,
            type,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            throw new NotFoundException('Invalid or expired OTP');
        }

        // Check if max attempts exceeded
        if (otpRecord.attempts >= 3) {
            await this.otpModel.updateOne(
                { _id: otpRecord._id },
                { isUsed: true }
            );
            throw new BadRequestException('Max verification attempts exceeded');
        }

        // Verify OTP
        if (otpRecord.otp !== otp) {
            await this.otpModel.updateOne(
                { _id: otpRecord._id },
                { $inc: { attempts: 1 } }
            );
            throw new BadRequestException('Invalid OTP');
        }

        // Mark OTP as used
        await this.otpModel.updateOne(
            { _id: otpRecord._id },
            { isUsed: true, isVerified: true }
        );

        return {
            success: true,
            message: 'OTP verified successfully'
        };
    }

    async checkOTPResetPassword(email: string, otp: string, type: string) {
        const otpRecord = await this.otpModel.findOne({
            email,
            type,
            otp,
            isUsed: true,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return false
        }
        return true
    }

    async getLatestVerifiedOTP(email: string, type: 'RESET_PASSWORD' | 'EMAIL_VERIFICATION'): Promise<OtpDocument | null> {
        return this.otpModel.findOne({
            email,
            type,
            isVerified: true,
            isUsed: true,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });
    }

    async invalidateOTPs(email: string, type: 'RESET_PASSWORD' | 'EMAIL_VERIFICATION'): Promise<void> {
        await this.otpModel.updateMany(
            { email, type, isUsed: false },
            { isUsed: true }
        );
    }
}