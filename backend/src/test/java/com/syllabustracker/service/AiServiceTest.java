package com.syllabustracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syllabustracker.dto.AiChatMessage;
import com.syllabustracker.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiServiceTest {

    @Test
    void chatUsesSupportedGroqTokenLimitAndLowReasoning() throws Exception {
        RestTemplate restTemplate = mock(RestTemplate.class);
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode response = objectMapper.readTree(
                "{\"choices\":[{\"message\":{\"content\":\"Keep practicing.\"}}]}");
        AtomicReference<JsonNode> sentBody = new AtomicReference<>();
        when(restTemplate.exchange(
                anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(JsonNode.class)))
                .thenAnswer(invocation -> {
                    HttpEntity<String> request = invocation.getArgument(2);
                    sentBody.set(objectMapper.readTree(request.getBody()));
                    return ResponseEntity.ok(response);
                });

        AiService service = new AiService(restTemplate, objectMapper);
        ReflectionTestUtils.setField(service, "apiKey", "test-key");
        ReflectionTestUtils.setField(service, "model", "openai/gpt-oss-120b");

        assertEquals("Keep practicing.", service.chat(List.of(new AiChatMessage("user", "Help me study.")), null));
        assertEquals(800, sentBody.get().path("max_completion_tokens").asInt());
        assertEquals("low", sentBody.get().path("reasoning_effort").asText());
        assertFalse(sentBody.get().has("max_tokens"));
    }

    @Test
    void chatReportsMissingApiKeyWithoutCallingProvider() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        AiService service = new AiService(restTemplate, new ObjectMapper());

        ApiException error = assertThrows(ApiException.class,
                () -> service.chat(List.of(new AiChatMessage("user", "Hello")), null));

        assertEquals("The AI assistant is not configured on the server. Set GROQ_API_KEY.", error.getMessage());
        verify(restTemplate, org.mockito.Mockito.never())
                .exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(JsonNode.class));
    }
}
