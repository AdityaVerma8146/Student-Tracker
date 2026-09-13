package com.syllabustracker.service;

import com.syllabustracker.entity.FeedbackEntity;
import com.syllabustracker.exception.ApiException;
import com.syllabustracker.repository.FeedbackRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class FeedbackService {

    private static final Logger log = LoggerFactory.getLogger(FeedbackService.class);
    private static final List<String> VALID_TYPES = List.of("CONTACT", "BUG_REPORT");

    private final FeedbackRepository feedbackRepository;

    public FeedbackService(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    /**
     * There's no email/ticketing service wired up here, so submissions are
     * persisted (queryable later via the H2 console or a future admin view)
     * and also written to the application log, so at minimum whoever is
     * running the server sees it show up immediately.
     */
    public void submit(String fromEmail, String type, String subject, String message) {
        if (fromEmail == null || fromEmail.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Your email is required.");
        }
        if (!VALID_TYPES.contains(type)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid feedback type.");
        }
        if (message == null || message.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please enter a message.");
        }
        if (message.length() > 5000) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Message is too long (max 5000 characters).");
        }

        String finalSubject = (subject == null || subject.isBlank())
                ? ("BUG_REPORT".equals(type) ? "Problem report" : "Contact request")
                : subject.trim();

        FeedbackEntity entity = new FeedbackEntity(fromEmail.trim(), type, finalSubject, message.trim(), Instant.now().toString());
        feedbackRepository.save(entity);

        log.info("New {} from {}: {} — {}", type, fromEmail, finalSubject, message.trim());
    }
}
