package com.syllabustracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.syllabustracker.dto.AiChatMessage;
import com.syllabustracker.dto.AiCorrectResponse;
import com.syllabustracker.dto.AiScheduleResponse;
import com.syllabustracker.dto.AiScheduleTask;
import com.syllabustracker.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class AiService {

    // Groq's API is OpenAI-compatible: same /chat/completions shape,
    // {"choices":[{"message":{"content":"..."}}]} response — different
    // from Anthropic's /v1/messages + content-blocks shape this used before.
    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final List<String> VALID_CATEGORIES = List.of("study", "assignment", "exam", "revision", "other");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${groq.api-key:}")
    private String apiKey;

    @Value("${groq.model:openai/gpt-oss-120b}")
    private String model;

    public AiService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    private void requireApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "The AI assistant is not configured on the server. Set GROQ_API_KEY.");
        }
    }

    /**
     * Sends a system + user turn to Groq and returns the raw text of the
     * assistant's reply (expected to be a single JSON object, possibly still
     * wrapped in markdown fences despite instructions — callers should strip
     * those).
     */
    private String callGroq(String systemPrompt, String userMessage, int maxTokens) {
        List<AiChatMessage> turns = new ArrayList<>();
        turns.add(new AiChatMessage("user", userMessage));
        return callGroqConversation(systemPrompt, turns, maxTokens, 0.4);
    }

    /**
     * Sends a system prompt plus an arbitrary multi-turn conversation to
     * Groq and returns the raw text of the assistant's latest reply. Used
     * by the free-form chat assistant, where — unlike correctText/
     * generateSchedule — the reply is shown to the user as-is rather than
     * parsed as JSON.
     */
    private String callGroqConversation(String systemPrompt, List<AiChatMessage> turns, int maxTokens, double temperature) {
        requireApiKey();

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", model);
        body.put("max_tokens", maxTokens);
        body.put("temperature", temperature);
        ArrayNode messages = body.putArray("messages");

        ObjectNode systemTurn = messages.addObject();
        systemTurn.put("role", "system");
        systemTurn.put("content", systemPrompt);

        for (AiChatMessage turn : turns) {
            String role = "assistant".equals(turn.role()) ? "assistant" : "user";
            ObjectNode node = messages.addObject();
            node.put("role", role);
            node.put("content", turn.content() == null ? "" : turn.content());
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<String> request = new HttpEntity<>(body.toString(), headers);

        ResponseEntity<JsonNode> response;
        try {
            response = restTemplate.exchange(GROQ_URL, HttpMethod.POST, request, JsonNode.class);
        } catch (HttpStatusCodeException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "The AI assistant request failed (" + e.getStatusCode() + "). Please try again.");
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not reach the AI assistant. Please try again.");
        }

        JsonNode payload = response.getBody();
        JsonNode choices = payload == null ? null : payload.path("choices");
        if (choices == null || !choices.isArray() || choices.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "The AI assistant returned an empty response.");
        }

        return choices.get(0).path("message").path("content").asText("");
    }

    /** Strips ```json fences if the model wrapped its JSON despite instructions not to. */
    private String stripCodeFences(String raw) {
        String trimmed = raw.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```[a-zA-Z]*\\n", "");
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3);
            }
        }
        return trimmed.trim();
    }

    public AiCorrectResponse correctText(String text) {
        if (text == null || text.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Text is required.");
        }
        if (text.length() > 8000) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Text is too long (max 8000 characters).");
        }

        String systemPrompt = """
            You proofread short pieces of text for a student study-tracker app \
            (task titles, roadmap notes, diary entries). Fix spelling, grammar, \
            and punctuation mistakes only — never change the meaning, tone, or \
            add new content. If the text has no mistakes, return it unchanged.

            Respond with ONLY a JSON object, no markdown fences, no commentary, \
            in exactly this shape:
            {"corrected": "<the corrected text>", "changed": <true|false>, "explanation": "<one short sentence, or empty string if unchanged>"}
            """;

        String raw = callGroq(systemPrompt, text, 1024);
        String jsonText = stripCodeFences(raw);

        try {
            JsonNode parsed = objectMapper.readTree(jsonText);
            String corrected = parsed.path("corrected").asText(text);
            boolean changed = parsed.path("changed").asBoolean(!corrected.equals(text));
            String explanation = parsed.path("explanation").asText("");
            return new AiCorrectResponse(corrected, changed, explanation.isBlank() ? null : explanation);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "The AI assistant returned an unexpected response. Please try again.");
        }
    }

    public AiScheduleResponse generateSchedule(String prompt, String startDate, String context) {
        if (prompt == null || prompt.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please describe what you need a schedule for.");
        }
        if (prompt.length() > 2000) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Prompt is too long (max 2000 characters).");
        }

        String effectiveStart;
        try {
            effectiveStart = (startDate == null || startDate.isBlank())
                    ? LocalDate.now().toString()
                    : LocalDate.parse(startDate).toString();
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid start date.");
        }

        String systemPrompt = """
            You are a study-planning assistant inside a student to-do list app. \
            Given a goal, an available time budget, and a start date, produce a \
            short, realistic day-by-day schedule of concrete tasks. Prefer 1-3 \
            tasks per day. Never schedule more days than the user's stated \
            timeframe allows, and never invent a timeframe if none was given — \
            in that case use your best judgement for a short (2-5 day) plan.

            Each task's "category" MUST be one of exactly: study, assignment, exam, revision, other.
            Each task's "date" MUST be an ISO date (YYYY-MM-DD), starting from the given start date.

            Respond with ONLY a JSON object, no markdown fences, no commentary, \
            in exactly this shape:
            {"summary": "<one short sentence describing the plan>", "tasks": [{"date": "YYYY-MM-DD", "title": "<short task title>", "category": "<one of the allowed categories>"}]}
            """;

        StringBuilder userMessage = new StringBuilder();
        userMessage.append("Start date: ").append(effectiveStart).append("\n");
        if (context != null && !context.isBlank()) {
            userMessage.append("Context about the user's existing work: ").append(context.trim()).append("\n");
        }
        userMessage.append("Goal: ").append(prompt.trim());

        String raw = callGroq(systemPrompt, userMessage.toString(), 1500);
        String jsonText = stripCodeFences(raw);

        JsonNode parsed;
        try {
            parsed = objectMapper.readTree(jsonText);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "The AI assistant returned an unexpected response. Please try again.");
        }

        String summary = parsed.path("summary").asText("Here's a suggested schedule.");
        List<AiScheduleTask> tasks = new ArrayList<>();
        if (parsed.has("tasks") && parsed.get("tasks").isArray()) {
            for (JsonNode t : parsed.get("tasks")) {
                String date = t.path("date").asText("");
                String title = t.path("title").asText("");
                String category = t.path("category").asText("other");
                if (!VALID_CATEGORIES.contains(category)) {
                    category = "other";
                }
                try {
                    LocalDate.parse(date); // validate; skip malformed entries rather than fail the whole response
                } catch (Exception e) {
                    continue;
                }
                if (title.isBlank()) continue;
                tasks.add(new AiScheduleTask(date, title.trim(), category));
            }
        }

        if (tasks.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "The AI assistant couldn't generate a schedule from that. Try adding more detail.");
        }

        return new AiScheduleResponse(summary, tasks);
    }

    private static final int MAX_CHAT_TURNS = 20;
    private static final int MAX_CHAT_MESSAGE_LENGTH = 4000;

    /**
     * Free-form assistant chat: unlike correctText/generateSchedule this
     * isn't limited to one task — it can answer any question the user asks
     * (study tips, explaining a concept, general conversation, etc.) while
     * staying aware of the app it's embedded in. Takes the full running
     * conversation so far so replies stay coherent across turns.
     */
    public String chat(List<AiChatMessage> messages, String context) {
        if (messages == null || messages.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Say something to start the conversation.");
        }

        // Keep only the most recent turns so the request stays small and
        // Groq's context window is never exceeded by a long-running chat.
        List<AiChatMessage> trimmed = messages.size() > MAX_CHAT_TURNS
                ? messages.subList(messages.size() - MAX_CHAT_TURNS, messages.size())
                : messages;

        List<AiChatMessage> sanitized = new ArrayList<>();
        for (AiChatMessage m : trimmed) {
            if (m == null || m.content() == null || m.content().isBlank()) continue;
            String content = m.content().length() > MAX_CHAT_MESSAGE_LENGTH
                    ? m.content().substring(0, MAX_CHAT_MESSAGE_LENGTH)
                    : m.content();
            sanitized.add(new AiChatMessage(m.role(), content));
        }

        if (sanitized.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Say something to start the conversation.");
        }

        StringBuilder systemPrompt = new StringBuilder("""
            You are the built-in AI assistant inside "Student Tracker", a student \
            study-tracker and to-do app (subjects/chapters/topics, a roadmap, a \
            calendar, a daily-tasks list, a diary, and study groups). You can \
            discuss anything the student asks — explain concepts, help debug a \
            homework problem, brainstorm, chat casually, or give study advice — \
            not just scheduling. Keep replies concise and conversational (a few \
            short paragraphs at most, use lists when they genuinely help). If the \
            student wants a day-by-day calendar schedule generated and added to \
            their calendar, tell them to use the "Build Schedule" tab instead, \
            since only that flow can write tasks onto their calendar.
            """);
        if (context != null && !context.isBlank()) {
            systemPrompt.append("\nContext about the student's current work: ").append(context.trim());
        }

        String raw = callGroqConversation(systemPrompt.toString(), sanitized, 800, 0.6);
        String reply = raw == null ? "" : raw.trim();
        if (reply.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "The AI assistant returned an empty response.");
        }
        return reply;
    }
}
