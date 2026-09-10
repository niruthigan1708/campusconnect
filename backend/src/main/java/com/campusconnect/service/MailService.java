package com.campusconnect.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${spring.mail.host:}")
    private String mailHost;

    /**
     * Best-effort send: with no SMTP host configured (the default for local dev -
     * see MAIL_HOST in .env.example), or if sending otherwise fails, this logs the
     * reset link instead of throwing, so password reset keeps working without
     * requiring real email credentials.
     */
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        if (mailHost == null || mailHost.isBlank()) {
            log.info("No SMTP host configured (MAIL_HOST) - password reset link for {}: {}", toEmail, resetLink);
            return;
        }

        String subject = "Reset your CampusConnect password";
        String body = "We received a request to reset your CampusConnect password.\n\n"
                + "Reset it here (this link expires shortly): " + resetLink + "\n\n"
                + "If you didn't request this, you can safely ignore this email.";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message);
            helper.setTo(toEmail);
            helper.setFrom(fromAddress);
            helper.setSubject(subject);
            helper.setText(body);
            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (Exception e) {
            log.warn("Failed to send password reset email to {} - falling back to log. Reset link: {}",
                    toEmail, resetLink, e);
        }
    }
}
