package com.syllabustracker.model;

public class Profile {
    private String name = "";
    private String bio = "";
    private String avatar = null;

    public Profile() {}

    public Profile(String name, String bio, String avatar) {
        this.name = name;
        this.bio = bio;
        this.avatar = avatar;
    }

    public static Profile empty() {
        return new Profile("", "", null);
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
}
