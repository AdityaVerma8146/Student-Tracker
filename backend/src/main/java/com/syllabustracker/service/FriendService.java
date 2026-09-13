package com.syllabustracker.service;

import com.syllabustracker.dto.FriendRequestView;
import com.syllabustracker.dto.PublicProfile;
import com.syllabustracker.entity.FriendshipEntity;
import com.syllabustracker.exception.ApiException;
import com.syllabustracker.repository.FriendshipRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
public class FriendService {

    private final FriendshipRepository friendshipRepository;
    private final AuthService authService;

    public FriendService(FriendshipRepository friendshipRepository, AuthService authService) {
        this.friendshipRepository = friendshipRepository;
        this.authService = authService;
    }

    private String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    public void sendRequest(String rawFrom, String rawTo) {
        String from = normalize(rawFrom);
        String to = normalize(rawTo);
        if (from == null || to == null || from.isBlank() || to.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Both accounts are required.");
        }
        if (from.equals(to)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You can't add yourself as a friend.");
        }
        // Confirms the target account exists (404s otherwise).
        authService.getPublicProfile(to);

        friendshipRepository.findBetween(from, to).ifPresent(existing -> {
            if ("ACCEPTED".equals(existing.getStatus())) {
                throw new ApiException(HttpStatus.CONFLICT, "You're already friends.");
            }
            if ("PENDING".equals(existing.getStatus())) {
                throw new ApiException(HttpStatus.CONFLICT, "A friend request is already pending between these accounts.");
            }
        });

        FriendshipEntity entity = new FriendshipEntity(from, to, Instant.now().toString());
        friendshipRepository.save(entity);
    }

    public void respond(Long friendshipId, String rawByEmail, boolean accept) {
        String byEmail = normalize(rawByEmail);
        FriendshipEntity entity = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Friend request not found."));

        if (!entity.getRecipientEmail().equals(byEmail)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the recipient can respond to this request.");
        }
        if (!"PENDING".equals(entity.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "This request has already been responded to.");
        }

        entity.setStatus(accept ? "ACCEPTED" : "DECLINED");
        entity.setRespondedAt(Instant.now().toString());
        friendshipRepository.save(entity);
    }

    public void removeFriend(String rawA, String rawB) {
        String a = normalize(rawA);
        String b = normalize(rawB);
        FriendshipEntity entity = friendshipRepository.findBetween(a, b)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "You're not friends with this account."));
        friendshipRepository.delete(entity);
    }

    public List<PublicProfile> listFriends(String rawEmail) {
        String email = normalize(rawEmail);
        return friendshipRepository.findAcceptedInvolving(email).stream()
                .map(f -> f.getRequesterEmail().equals(email) ? f.getRecipientEmail() : f.getRequesterEmail())
                .map(authService::getPublicProfile)
                .toList();
    }

    public List<FriendRequestView> listIncomingRequests(String rawEmail) {
        String email = normalize(rawEmail);
        return friendshipRepository.findIncomingPending(email).stream()
                .map(f -> new FriendRequestView(f.getId(), authService.getPublicProfile(f.getRequesterEmail()), f.getCreatedAt()))
                .toList();
    }

    /** Used by GroupService to check "are these two people friends" before letting a leader add someone. */
    public boolean areFriends(String rawA, String rawB) {
        String a = normalize(rawA);
        String b = normalize(rawB);
        return friendshipRepository.findBetween(a, b)
                .map(f -> "ACCEPTED".equals(f.getStatus()))
                .orElse(false);
    }
}
