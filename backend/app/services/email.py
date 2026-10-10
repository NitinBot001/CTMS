from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import Settings

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        settings: Settings,
    ) -> dict[str, Any]:
        """
        Sends an email using Resend API if configured, otherwise logs safely in dev mode.
        Never logs full sensitive tokens or passwords.
        """
        if not settings.RESEND_API_KEY:
            logger.info(
                f"[DEV EMAIL] Simulating delivery to {to_email} | Subject: '{subject}'"
            )
            return {"status": "simulated", "to": to_email, "subject": subject}

        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "from": settings.RESEND_FROM_EMAIL or "onboarding@resend.dev",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code >= 400:
                    logger.error(
                        f"Resend API error ({response.status_code}): {response.text}"
                    )
                    return {
                        "status": "error",
                        "statusCode": response.status_code,
                        "error": response.text,
                        "id": None,
                    }
                data: dict[str, Any] = response.json()
                return data
        except Exception as exc:
            logger.error(f"Failed to communicate with Resend API: {exc}")
            return {
                "status": "error",
                "error": str(exc),
                "id": None,
            }

    @staticmethod
    async def send_activation_email(
        to_email: str,
        recipient_name: str,
        raw_token: str,
        settings: Settings,
    ) -> dict[str, Any]:
        activation_url = f"{settings.APP_BASE_URL.rstrip('/')}/activate?token={raw_token}"
        subject = "AyuCTMS — Activate Your Platform Account"
        html_content = f"""
        <div style="font-family: sans-serif; color: #1C1A17; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #7A2A12; margin-bottom: 16px;">Welcome to AyuCTMS, {recipient_name}</h2>
            <p>Your access request has been approved by the Government Verification Team.</p>
            <p>Please click the button below to establish your account password and activate your access:</p>
            <div style="margin: 28px 0;">
                <a href="{activation_url}" style="background-color: #7A2A12; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Activate Account
                </a>
            </div>
            <p style="color: #726B5C; font-size: 13px;">This single-use activation link expires in 7 days. If you did not request access, please ignore this email.</p>
        </div>
        """
        return await EmailService.send_email(to_email, subject, html_content, settings)

    @staticmethod
    async def send_team_invitation_email(
        to_email: str,
        recipient_name: str,
        inviter_name: str,
        context_name: str,
        raw_token: str,
        settings: Settings,
    ) -> dict[str, Any]:
        activation_url = f"{settings.APP_BASE_URL.rstrip('/')}/activate?token={raw_token}"
        subject = f"AyuCTMS — Invitation to join {context_name}"
        html_content = f"""
        <div style="font-family: sans-serif; color: #1C1A17; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #7A2A12; margin-bottom: 16px;">Clinical Research Team Invitation</h2>
            <p>Dear {recipient_name},</p>
            <p><strong>{inviter_name}</strong> has invited you to join the research team for <strong>{context_name}</strong>.</p>
            <p>Your credentials have been verified by the Government Verification Team. Please activate your account below:</p>
            <div style="margin: 28px 0;">
                <a href="{activation_url}" style="background-color: #7A2A12; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Accept Invitation & Activate
                </a>
            </div>
            <p style="color: #726B5C; font-size: 13px;">This single-use link expires in 7 days.</p>
        </div>
        """
        return await EmailService.send_email(to_email, subject, html_content, settings)

    @staticmethod
    async def send_site_participation_request_email(
        to_email: str,
        site_name: str,
        study_title: str,
        requester_name: str,
        settings: Settings,
    ) -> dict[str, Any]:
        subject = f"AyuCTMS — Study Participation Request for {site_name}"
        html_content = f"""
        <div style="font-family: sans-serif; color: #1C1A17; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #7A2A12; margin-bottom: 16px;">Study Participation Request</h2>
            <p>A new clinical study participation request has been initiated for <strong>{site_name}</strong>.</p>
            <p><strong>Study:</strong> {study_title}</p>
            <p><strong>Requested by:</strong> {requester_name}</p>
            <p>Please log in to AyuCTMS and navigate to your Site Dashboard to review and independently confirm or decline participation.</p>
        </div>
        """
        return await EmailService.send_email(to_email, subject, html_content, settings)
