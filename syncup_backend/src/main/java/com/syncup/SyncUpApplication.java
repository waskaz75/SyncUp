package com.syncup;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.syncup.database.JdbcConnector;

@SpringBootApplication
public class SyncUpApplication implements CommandLineRunner {

    @Value("${syncup.db.url:}")
    private String databaseUrl;

    @Value("${syncup.db.user:}")
    private String databaseUser;

    @Value("${syncup.db.password:}")
    private String databasePassword;

    public static void main(String[] args) {
        SpringApplication.run(SyncUpApplication.class, args);
    }

    @Override
    public void run(String... args) {
        JdbcConnector.configure(
                databaseUrl,
                databaseUser,
                databasePassword
        );
    }
}
