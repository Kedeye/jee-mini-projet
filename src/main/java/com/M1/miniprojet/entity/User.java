package com.M1.miniprojet.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String privilege; // "ADMIN" or "USER"

    @Column(nullable = false)
    private Boolean active;

    public User() {}

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getPrivilege() { return privilege; }
    public void setPrivilege(String privilege) { this.privilege = privilege; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
