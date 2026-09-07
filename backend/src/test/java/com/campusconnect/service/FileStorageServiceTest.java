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

    @Test
    void storeImage_savesFileAndReturnsPublicUrl() {
        MockMultipartFile file = new MockMultipartFile("file", "logo.png", "image/png", new byte[]{1, 2, 3});

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
        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", new byte[]{1, 2, 3});

        assertThrows(BadRequestException.class, () -> fileStorageService.storeImage(file, "clubs"));
    }

    @Test
    void storeImage_throwsWhenFileExceedsSizeLimit() {
        MockMultipartFile file = new MockMultipartFile("file", "big.png", "image/png", new byte[6 * 1024 * 1024]);

        assertThrows(BadRequestException.class, () -> fileStorageService.storeImage(file, "clubs"));
    }
}
