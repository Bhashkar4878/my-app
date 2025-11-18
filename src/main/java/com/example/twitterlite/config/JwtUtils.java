public class JwtUtils {
    
}
package com.example.twitterlite.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {

    private final Key key;
    private final long expiryMs;

    public JwtUtils(@Value("${app.jwt.secret}") String secret,
                    @Value("${app.jwt.expiration-ms}") long expiryMs) {
        // secret must be sufficiently long for HS256; prefer Base64-encoded or use env var
        if (secret == null || secret.trim().length() < 32) {
            // fallback to an insecure default only for development; replace in production
            secret = "replace_this_with_a_long_random_secret_replace_this!";
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expiryMs = expiryMs <= 0 ? 24 * 60 * 60 * 1000L : expiryMs;
    }

    public String generateToken(String username) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expiryMs);
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String validateAndGetUsername(String token) {
        try {
            Jws<Claims> jws = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return jws.getBody().getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            return null; // invalid token
        }
    }
}
