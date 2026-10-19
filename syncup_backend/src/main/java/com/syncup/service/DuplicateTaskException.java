package com.syncup.service;

public class DuplicateTaskException extends RuntimeException {

    public DuplicateTaskException(String message) {
        super(message);
    }
}
