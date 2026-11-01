package com.syncup.realtime;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatHandler;
    private final VoiceWebSocketHandler voiceHandler;

    public WebSocketConfig(
            ChatWebSocketHandler chatHandler,
            VoiceWebSocketHandler voiceHandler) {
        this.chatHandler = chatHandler;
        this.voiceHandler = voiceHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatHandler, "/ws/comms")
                .setAllowedOriginPatterns(
                        "http://localhost:*",
                        "https://www.syncup-project.com",
                        "https://syncup-project.com");
        registry.addHandler(voiceHandler, "/ws/voice")
                .setAllowedOriginPatterns(
                        "http://localhost:*",
                        "https://www.syncup-project.com",
                        "https://syncup-project.com");
    }
}
