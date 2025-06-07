package com.M1.miniprojet.dao;

import com.M1.miniprojet.entity.User;
import jakarta.ejb.Stateless;
import jakarta.persistence.*;
import java.util.List;

@Stateless
public class UserDao {
    @PersistenceContext
    private EntityManager em;

    public User findByUsername(String username) {
        try {
            return em.createQuery(
                "SELECT u FROM User u WHERE u.username = :username", User.class)
                .setParameter("username", username)
                .getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    public List<User> findAll() {
        return em.createQuery("SELECT u FROM User u", User.class).getResultList();
    }

    public void create(User user) {
        em.persist(user);
    }

    public void update(User user) {
        em.merge(user);
    }

    public void delete(Long id) {
        User user = em.find(User.class, id);
        if (user != null) em.remove(user);
    }
}
