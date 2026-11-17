package com.campusconnect.exception;

import com.campusconnect.entity.EventCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Drives real Spring MVC request handling (argument binding, JSON parsing)
 * through a stub controller, so each framework exception is raised the same
 * way it would be in production.
 */
class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @RestController
    @RequestMapping("/test")
    static class StubController {

        @GetMapping("/items/{id}")
        String byId(@PathVariable Long id) {
            return "ok";
        }

        @GetMapping("/filter")
        String filter(@RequestParam EventCategory category) {
            return "ok";
        }

        @PostMapping("/body")
        String body(@RequestBody Map<String, String> body) {
            return "ok";
        }

        @PostMapping("/upload")
        String upload(@RequestParam("file") MultipartFile file) {
            return "ok";
        }

        @GetMapping("/too-large")
        String tooLarge() {
            throw new MaxUploadSizeExceededException(5L * 1024 * 1024);
        }

        @GetMapping("/conflict")
        String conflict() {
            throw new DataIntegrityViolationException("duplicate key value violates unique constraint \"uk_x\"");
        }

        @GetMapping("/boom")
        String boom() {
            throw new IllegalStateException("internal detail");
        }
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new StubController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void nonNumericPathVariable_returns400() throws Exception {
        mockMvc.perform(get("/test/items/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid value for parameter 'id'"));
    }

    @Test
    void unknownEnumQueryParameter_returns400() throws Exception {
        mockMvc.perform(get("/test/filter").param("category", "NOPE"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid value for parameter 'category'"));
    }

    @Test
    void missingQueryParameter_returns400() throws Exception {
        mockMvc.perform(get("/test/filter"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Missing required parameter 'category'"));
    }

    @Test
    void malformedJson_returns400() throws Exception {
        mockMvc.perform(post("/test/body").contentType(MediaType.APPLICATION_JSON).content("{bad json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Request body is missing or malformed"));
    }

    @Test
    void missingMultipartFile_returns400() throws Exception {
        mockMvc.perform(multipart("/test/upload"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void oversizedUpload_returns413() throws Exception {
        mockMvc.perform(get("/test/too-large"))
                .andExpect(status().isPayloadTooLarge());
    }

    @Test
    void wrongHttpMethod_returns405() throws Exception {
        mockMvc.perform(delete("/test/filter"))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    void unsupportedContentType_returns415() throws Exception {
        mockMvc.perform(post("/test/body").contentType(MediaType.TEXT_PLAIN).content("hello"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void dataIntegrityViolation_returns409WithoutLeakingSql() throws Exception {
        mockMvc.perform(get("/test/conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("The request conflicts with existing data"));
    }

    @Test
    void unexpectedException_stillReturnsGeneric500() throws Exception {
        mockMvc.perform(get("/test/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("An unexpected error occurred"));
    }
}
