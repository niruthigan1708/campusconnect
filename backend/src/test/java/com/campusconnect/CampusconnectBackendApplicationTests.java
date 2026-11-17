package com.campusconnect;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Boots the whole application against a fresh PostgreSQL. Because Hibernate
 * runs with ddl-auto=validate, a successful start also proves the Flyway
 * migrations produce exactly the schema the JPA entities expect.
 */
@IntegrationTest
class CampusconnectBackendApplicationTests {

	@Autowired
	private Flyway flyway;

	@Test
	void contextLoadsAndAllMigrationsApply() {
		MigrationInfo[] applied = flyway.info().applied();
		MigrationInfo[] pending = flyway.info().pending();

		assertThat(applied).isNotEmpty();
		assertThat(pending).isEmpty();
	}

}
