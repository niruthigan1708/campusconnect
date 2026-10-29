package com.campusconnect.service;

import com.campusconnect.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5MB
    private static final Map<String, String> ALLOWED_CONTENT_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private final Path uploadRoot;

    public FileStorageService(@Value("${app.uploads.dir}") String uploadDir) {
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadRoot);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory: " + uploadRoot, e);
        }
    }

    /**
     * Saves an uploaded image under a subdirectory (e.g. "clubs", "events") and
     * returns the public URL path it will be served from.
     */
    public String storeImage(MultipartFile file, String subdirectory) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("No file was uploaded");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("Image must be 5MB or smaller");
        }

        String extension = ALLOWED_CONTENT_TYPES.get(file.getContentType());
        if (extension == null) {
            throw new BadRequestException("Only JPEG, PNG, or WEBP images are allowed");
        }

        try {
            byte[] content = file.getBytes();
            if (!matchesDeclaredImageType(content, file.getContentType())) {
                throw new BadRequestException("The file's content does not match a valid JPEG, PNG, or WEBP image");
            }

            Path subdirPath = uploadRoot.resolve(subdirectory).normalize();
            Files.createDirectories(subdirPath);

            String filename = UUID.randomUUID() + extension;
            Path destination = subdirPath.resolve(filename);
            Files.write(destination, content);

            return "/uploads/" + subdirectory + "/" + filename;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store uploaded file", e);
        }
    }

    /**
     * Checks the file's actual bytes against the declared content type's magic
     * number instead of trusting the client-supplied Content-Type header alone.
     */
    private boolean matchesDeclaredImageType(byte[] content, String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> startsWith(content, (byte) 0xFF, (byte) 0xD8, (byte) 0xFF);
            case "image/png" -> startsWith(content,
                    (byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47, (byte) 0x0D, (byte) 0x0A, (byte) 0x1A, (byte) 0x0A);
            case "image/webp" -> content.length >= 12
                    && startsWith(content, (byte) 'R', (byte) 'I', (byte) 'F', (byte) 'F')
                    && content[8] == 'W' && content[9] == 'E' && content[10] == 'B' && content[11] == 'P';
            default -> false;
        };
    }

    private boolean startsWith(byte[] content, byte... signature) {
        if (content.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if (content[i] != signature[i]) {
                return false;
            }
        }
        return true;
    }

    Path getUploadRoot() {
        return uploadRoot;
    }
}
