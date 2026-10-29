package com.syncup.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ImageGenerationService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private final ObjectMapper objectMapper;
    private final String apiToken;
    private final String accountId;
    private final String imageModel;

    public ImageGenerationService(
            ObjectMapper objectMapper,
            @Value("${cloudflare.api-token}") String apiToken,
            @Value("${cloudflare.account-id}") String accountId,
            @Value("${cloudflare.image-model}") String imageModel) {

        this.objectMapper = objectMapper;
        this.apiToken = apiToken;
        this.accountId = accountId;
        this.imageModel = imageModel;
    }

    public String generatePng(String prompt) {

        if (apiToken == null || apiToken.isBlank()
                || accountId == null || accountId.isBlank()) {
            throw new IllegalStateException(
                    "Cloudflare AI credentials are not configured.");
        }

        try {
            // Convert the user's prompt into JSON
            String requestBody = objectMapper.writeValueAsString(
                    Map.of("prompt", prompt));

            // Build the Cloudflare API request
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(
                            "https://api.cloudflare.com/client/v4/accounts/"
                            + accountId + "/ai/run/" + imageModel))
                    .timeout(Duration.ofSeconds(90))
                    .header("Authorization", "Bearer " + apiToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            // Send the request to Cloudflare
            HttpResponse<byte[]> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofByteArray());

            // Check whether Cloudflare accepted the request
            if (response.statusCode() < 200
                    || response.statusCode() >= 300) {
                throw new IllegalStateException(
                        "Cloudflare image generation failed. HTTP status: "
                        + response.statusCode());
            }

            // Check for an empty response
            if (response.body().length == 0) {
                throw new IllegalStateException(
                        "Cloudflare did not return an image.");
            }

            // Parse Cloudflare's JSON response
            Map<?, ?> payload = objectMapper.readValue(
                    response.body(), Map.class);

            // Check whether Cloudflare reported success
            if (!Boolean.TRUE.equals(payload.get("success"))) {
                throw new IllegalStateException(
                        "Cloudflare reported an image generation failure.");
            }

            // Extract the result object
            Object resultObject = payload.get("result");

            if (!(resultObject instanceof Map<?, ?> result)) {
                throw new IllegalStateException(
                        "Cloudflare returned an invalid response.");
            }

            // Extract the Base64 image from result.image
            Object imageObject = result.get("image");

            if (!(imageObject instanceof String image)
                    || image.isBlank()) {
                throw new IllegalStateException(
                        "Cloudflare did not return image data.");
            }

            // Return the generated JPEG image to the frontend
            return "data:image/jpeg;base64," + image;

        } catch (IOException error) {
            throw new IllegalStateException(
                    "Unable to reach Cloudflare image generation.",
                    error);

        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "Image generation was interrupted.",
                    error);
        }
    }
}
