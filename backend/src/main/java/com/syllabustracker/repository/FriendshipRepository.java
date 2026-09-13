package com.syllabustracker.repository;

import com.syllabustracker.entity.FriendshipEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<FriendshipEntity, Long> {

    Optional<FriendshipEntity> findByRequesterEmailAndRecipientEmail(String requesterEmail, String recipientEmail);

    @Query("SELECT f FROM FriendshipEntity f WHERE f.status = 'PENDING' AND f.recipientEmail = :email")
    List<FriendshipEntity> findIncomingPending(@Param("email") String email);

    @Query("SELECT f FROM FriendshipEntity f WHERE f.status = 'PENDING' AND f.requesterEmail = :email")
    List<FriendshipEntity> findOutgoingPending(@Param("email") String email);

    @Query("SELECT f FROM FriendshipEntity f WHERE f.status = 'ACCEPTED' " +
           "AND (f.requesterEmail = :email OR f.recipientEmail = :email)")
    List<FriendshipEntity> findAcceptedInvolving(@Param("email") String email);

    @Query("SELECT f FROM FriendshipEntity f WHERE " +
           "(f.requesterEmail = :a AND f.recipientEmail = :b) OR (f.requesterEmail = :b AND f.recipientEmail = :a)")
    Optional<FriendshipEntity> findBetween(@Param("a") String a, @Param("b") String b);
}
