package com.syncup.database;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseInitializer {

    public static void initialize() {

        try (InputStream inputStream
               
                = DatabaseInitializer.class.getClassLoader()
                        .getResourceAsStream("database.sql")) {

                            if (inputStream == null) {
                                System.out.println("database.sql was not found.");
                                return;
                            }

                            String sql = new String(
                                    inputStream.readAllBytes(),
                                    StandardCharsets.UTF_8
                            );

                            // Remove SQL comment lines beginning with --
                            sql = sql.replaceAll("(?m)^\\s*--.*$", "");

                            // Split the file into individual SQL statements
                            String[] statements = sql.split(";");

                            try (Connection conn = JdbcConnector.getConnection(); Statement stmt = conn.createStatement()) {

                                for (String statement : statements) {

                                    String trimmedStatement = statement.trim();

                                    if (!trimmedStatement.isEmpty()) {
                                        stmt.execute(trimmedStatement);
                                    }
                                }

                                System.out.println(
                                        "Database tables initialized successfully."
                                );
                            }

                        } catch (IOException | SQLException e) {
                            System.out.println(
                                    "Database initialization failed: " + e.getMessage()
                            );
                            e.printStackTrace();
                        }
    }
}

