package com.syncup.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class JdbcConnector {

    private static String url = getEnvironmentVariable(
            "SYNCUP_DB_URL",
            isLocalProfile()
                    ? "jdbc:mysql://localhost:3306/syncupdb?useSSL=false&serverTimezone=UTC"
                    : "jdbc:mysql://syncupdb.c76g802m8y7r.us-east-2.rds.amazonaws.com:3306/syncupdb?useSSL=true&serverTimezone=UTC"
    );

    private static String user = getEnvironmentVariable(
            "SYNCUP_DB_USER",
            isLocalProfile() ? "syncup" : "SyncUpAdmin"
    );

    private static String password = getEnvironmentVariable(
            "SYNCUP_DB_PASSWORD",
            ""
    );

    private static String getEnvironmentVariable(
            String name,
            String defaultValue) {

        String value = System.getProperty(
                "syncup.db." + name.substring("SYNCUP_DB_".length()).toLowerCase()
        );

        if (value == null || value.isBlank()) {
            value = System.getenv(name);
        }

        return value == null || value.isBlank() ? defaultValue : value;
    }

    private static boolean isLocalProfile() {
        String profile = System.getProperty(
                "spring.profiles.active",
                System.getProperty("spring-boot.run.profiles", "")
        );

        return profile.contains("local")
                || "local".equalsIgnoreCase(
                        System.getenv("SPRING_PROFILES_ACTIVE")
                );
    }

    public static void configure(
            String configuredUrl,
            String configuredUser,
            String configuredPassword) {

        if (configuredUrl != null && !configuredUrl.isBlank()) {
            url = configuredUrl;
        }

        if (configuredUser != null && !configuredUser.isBlank()) {
            user = configuredUser;
        }

        if (configuredPassword != null) {
            password = configuredPassword;
        }
    }

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("Failed to load JDBC driver", e);
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(url, user, password);
    }
}
