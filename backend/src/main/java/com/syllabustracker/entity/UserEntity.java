package com.syllabustracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    @Column(name = "email", nullable = false, updatable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "mood")
    private String mood = "\uD83D\uDE0A"; // 😊

    // Denormalized copy of profile.name / profile.avatar (which otherwise
    // only exist inside the opaque data_json blob), kept in sync whenever
    // saveUserData() runs — lets friend/user search run a real indexed
    // query instead of deserializing every user's JSON on every search.
    @Column(name = "display_name")
    private String displayName = "";

    @Lob
    @Column(name = "avatar", columnDefinition = "CLOB")
    private String avatar;

    @Column(name = "google_account", nullable = false)
    private boolean googleAccount = false;

    @Column(name = "created_at", nullable = false)
    private String createdAt;

    @Lob
    @Column(name = "data_json", nullable = false, columnDefinition = "CLOB")
    private String dataJson;

    public UserEntity() {}

    public UserEntity(String email, String passwordHash, String mood, boolean googleAccount, String createdAt, String dataJson) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.mood = mood;
        this.googleAccount = googleAccount;
        this.createdAt = createdAt;
        this.dataJson = dataJson;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public boolean isGoogleAccount() { return googleAccount; }
    public void setGoogleAccount(boolean googleAccount) { this.googleAccount = googleAccount; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getDataJson() { return dataJson; }
    public void setDataJson(String dataJson) { this.dataJson = dataJson; }
}
