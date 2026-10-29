package com.syncup.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class StudyBuddyService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private final ObjectMapper objectMapper;
    private final String apiToken;
    private final String accountId;
    private final String model;

    public StudyBuddyService(
            ObjectMapper objectMapper,
            @Value("${cloudflare.api-token}") String apiToken,
            @Value("${cloudflare.account-id}") String accountId,
            @Value("${cloudflare.study-buddy-model}") String model) {
        this.objectMapper = objectMapper;
        this.apiToken = apiToken;
        this.accountId = accountId;
        this.model = model;
    }

    public String chat(String prompt) {
        if (apiToken == null || apiToken.isBlank()
                || accountId == null || accountId.isBlank()) {
            throw new IllegalStateException(
                    "Cloudflare AI credentials are not configured.");
        }

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "messages", List.of(
                            Map.of(
                                    "role", "system",
                                    "content",
                                    "You are Study Buddy, a supportive and concise AI study companion. "
                                            + "Help users understand concepts, plan study sessions, and stay motivated. "
                                            + "Do not complete graded work dishonestly; explain the reasoning instead. "
                                            + "Format every response in clear Markdown: use a short heading when useful, "
                                            + "blank lines between sections, bullet or numbered lists for multiple points, "
                                            + "and fenced code blocks for code."),
                            Map.of("role", "user", "content", prompt))));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(
                            "https://api.cloudflare.com/client/v4/accounts/"
                                    + accountId + "/ai/run/" + model))
                    .timeout(Duration.ofSeconds(60))
                    .header("Authorization", "Bearer " + apiToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200
                    || response.statusCode() >= 300) {
                throw new IllegalStateException(
                        "Cloudflare Study Buddy request failed. HTTP status: "
                                + response.statusCode() + ": "
                                + extractCloudflareError(response.body()));
            }

            Map<?, ?> payload = objectMapper.readValue(
                    response.body(), Map.class);

            if (!Boolean.TRUE.equals(payload.get("success"))) {
                throw new IllegalStateException(
                        "Cloudflare reported a Study Buddy failure.");
            }

            Object resultObject = payload.get("result");

            if (!(resultObject instanceof Map<?, ?> result)) {
                throw new IllegalStateException(
                        "Cloudflare returned an invalid Study Buddy response.");
            }

            Object responseText = result.get("response");

            if (!(responseText instanceof String text) || text.isBlank()) {
                throw new IllegalStateException(
                        "Cloudflare did not return a Study Buddy response.");
            }

            return text.trim();
        } catch (IOException error) {
            throw new IllegalStateException(
                    "Unable to reach Cloudflare Study Buddy.", error);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(
                    "Study Buddy request was interrupted.", error);
        }
    }

    private String extractCloudflareError(String responseBody) {
        try {
            Map<?, ?> payload = objectMapper.readValue(responseBody, Map.class);
            Object errorsObject = payload.get("errors");

            if (errorsObject instanceof List<?> errors
                    && !errors.isEmpty()) {
                return errors.get(0).toString();
            }
        } catch (IOException ignored) {
            // Fall back to the HTTP status when Cloudflare does not return JSON.
        }

        return "Cloudflare did not provide additional error details.";
    }
}
