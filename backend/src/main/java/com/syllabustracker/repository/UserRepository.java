package com.syllabustracker.repository;

import com.syllabustracker.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserRepository extends JpaRepository<UserEntity, String> {
    // email is the @Id, so findById/existsById/deleteById already give us
    // everything the original backend's `SELECT ... WHERE email = ?` did.

    @Query("SELECT u FROM UserEntity u WHERE LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(u.displayName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<UserEntity> searchByEmailOrDisplayName(@Param("query") String query);
}
