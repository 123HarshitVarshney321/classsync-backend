package com.classsync;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
public class TestDatabaseIsolationTest {

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("Verify tests run exclusively against classsync_test database")
    void testDatabaseIsIsolated() throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            assertEquals("classsync_test", connection.getCatalog(),
                    "Test database must be classsync_test to protect developer database from corruption/deletion");
        }
    }
}
