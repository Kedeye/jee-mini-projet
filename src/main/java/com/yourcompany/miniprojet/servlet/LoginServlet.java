package com.yourcompany.miniprojet.servlet;

import com.yourcompany.miniprojet.dao.UserDao;
import com.yourcompany.miniprojet.entity.User;
import jakarta.inject.Inject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;

@WebServlet("/api/login")
public class LoginServlet extends HttpServlet {
    @Inject
    private UserDao userDao;

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String username = req.getParameter("username");
        String password = req.getParameter("password");

        User user = userDao.findByUsername(username);
        if (user != null && user.getPassword().equals(password) && user.getActive()) {
            req.getSession(true).setAttribute("user", user);
            resp.setStatus(HttpServletResponse.SC_OK);
        } else {
            resp.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid credentials or inactive user");
        }
    }
}
