package com.campusconnect;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Starts a real PostgreSQL in Docker for integration tests. @ServiceConnection
 * points Spring's DataSource at it automatically, so Flyway runs the real
 * migrations and Hibernate validates the entities against them.
 *
 * <p>Every test class importing this with the same configuration shares one
 * cached Spring context, and therefore one container per test run.
 * Same major version as docker-compose.yml.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    PostgreSQLContainer postgresContainer() {
        return new PostgreSQLContainer(DockerImageName.parse("postgres:16-alpine"));
    }
}
