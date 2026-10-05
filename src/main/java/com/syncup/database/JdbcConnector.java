package com.syncup.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class JdbcConnector {

    private static final String URL = "jdbc:mysql://syncupdb.c76g802m8y7r.us-east-2.rds.amazonaws.com:3306/syncupdb?useSSL=true&serverTimezone=UTC";

    private static final String USER = "SyncUpAdmin";

    private static final String PASSWORD
            = System.getenv("SYNCUP_DB_PASSWORD");

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("Failed to load JDBC driver", e);
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
}
