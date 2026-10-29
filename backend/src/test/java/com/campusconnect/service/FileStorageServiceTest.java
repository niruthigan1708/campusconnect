package com.campusconnect.service;

import com.campusconnect.exception.BadRequestException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService(tempDir.toString());
    }

    @AfterEach
    void cleanUp() throws IOException {
        try (Stream<Path> paths = Files.walk(tempDir)) {
            paths.sorted((a, b) -> b.compareTo(a)).forEach(p -> {
                try {
                    Files.deleteIfExists(p);
                } catch (IOException ignored) {
                }
            });
        }
    }

    private static final byte[] PNG_SIGNATURE =
            {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
    private static final byte[] JPEG_SIGNATURE = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0, 0, 0};

    @Test
    void storeImage_savesFileAndReturnsPublicUrl() {
        MockMultipartFile file = new MockMultipartFile("file", "logo.png", "image/png", PNG_SIGNATURE);

        String url = fileStorageService.storeImage(file, "clubs");

        assertThat(url).startsWith("/uploads/clubs/").endsWith(".png");
        Path saved = tempDir.resolve(url.replaceFirst("^/uploads/", ""));
        assertThat(Files.exists(saved)).isTrue();
    }

    @Test
    void storeImage_throwsWhenFileIsEmpty() {
        MockMultipartFile file = new MockMultipartFile("file", "empty.png", "image/png", new byte[0]);

        assertThrows(BadRequestException.class, () -> fileStorageService.storeImage(file, "clubs"));
    }

    @Test
    void storeImage_throwsWhenContentTypeNotAllowed() {
        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", PNG_SIGNATURE);

        assertThrows(BadRequestException.class, () -> fileStorageService.storeImage(file, "clubs"));
    }

    @Test
    void storeImage_throwsWhenFileExceedsSizeLimit() {
        MockMultipartFile file = new MockMultipartFile("file", "big.png", "image/png", new byte[6 * 1024 * 1024]);

        assertThrows(BadRequestException.class, () -> fileStorageService.storeImage(file, "clubs"));
    }

    @Test
    void storeImage_throwsWhenContentDoesNotMatchDeclaredType() {
        // Declares PNG but the bytes are actually a JPEG signature - the declared
        // Content-Type header alone is not trusted.
        MockMultipartFile file = new MockMultipartFile("file", "fake.png", "image/png", JPEG_SIGNATURE);

        assertThrows(BadRequestException.class, () -> fileStorageService.storeImage(file, "clubs"));
    }
}
