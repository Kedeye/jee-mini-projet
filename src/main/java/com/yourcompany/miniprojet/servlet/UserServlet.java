package com.yourcompany.miniprojet.servlet;

import com.yourcompany.miniprojet.dao.UserDao;
import com.yourcompany.miniprojet.entity.User;
import jakarta.inject.Inject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.List;
import com.google.gson.Gson;

@WebServlet("/api/users/*")
public class UserServlet extends HttpServlet {
    @Inject
    private UserDao userDao;

    // Get all users
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<User> users = userDao.findAll();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        String json = new Gson().toJson(users);
        resp.getWriter().write(json);
    }

    // Add user
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            // Parse incoming JSON
            User user = new Gson().fromJson(req.getReader(), User.class);
            if (user.getUsername() == null || user.getPassword() == null
                || user.getPrivilege() == null || user.getActive() == null) {
                resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing fields");
                return;
            }
            userDao.create(user);
            resp.setStatus(HttpServletResponse.SC_CREATED);
        } catch (Exception ex) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Error parsing or saving user: " + ex.getMessage());
        }
    }

    // Delete user by ID (expects /api/users/{id})
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo(); // e.g. /3
        if (pathInfo == null || pathInfo.equals("/") || pathInfo.length() < 2) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "User ID is required");
            return;
        }
        try {
            Long id = Long.parseLong(pathInfo.substring(1));
            userDao.delete(id);
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
        } catch (NumberFormatException e) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid User ID");
        }
    }
    
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo(); // e.g. /3
        if (pathInfo == null || pathInfo.equals("/") || pathInfo.length() < 2) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "User ID is required");
            return;
        }
        try {
            Long id = Long.parseLong(pathInfo.substring(1));
            User existing = userDao.findAll().stream().filter(u -> u.getId().equals(id)).findFirst().orElse(null);
            if (existing == null) {
                resp.sendError(HttpServletResponse.SC_NOT_FOUND, "User not found");
                return;
            }
            // Parse JSON
            User incoming = new Gson().fromJson(req.getReader(), User.class);
            existing.setUsername(incoming.getUsername());
            if (incoming.getPassword() != null && !incoming.getPassword().isEmpty()) {
                existing.setPassword(incoming.getPassword());
            }
            existing.setPrivilege(incoming.getPrivilege());
            existing.setActive(incoming.getActive());
            userDao.update(existing);
            resp.setStatus(HttpServletResponse.SC_OK);
        } catch (Exception ex) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Error updating user: " + ex.getMessage());
        }
    }
}
