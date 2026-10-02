package com.skillforge.api.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.cert.X509Certificate;

/**
 * MongoConfig — custom MongoDB client configuration for Spring Boot.
 *
 * WHY THIS IS NEEDED:
 * Windows' JSSE (Java Secure Socket Extension) and SSPI layer
 * reject TLS connections to MongoDB Atlas with an 'internal_error'
 * alert during the handshake. Node.js bypasses this by using its
 * own bundled OpenSSL implementation.
 *
 * This config creates a custom SSLContext with a trust-all
 * TrustManager that bypasses the Windows certificate chain
 * validation failure. This is acceptable for development and
 * college demo purposes.
 *
 * The MongoClient bean registered here overrides Spring Boot's
 * auto-configured one, giving us full control.
 *
 * Week 8 Day 2
 */
@Configuration
public class MongoConfig extends AbstractMongoClientConfiguration {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;

    @Value("${spring.data.mongodb.database:skillforge}")
    private String databaseName;

    @Override
    protected String getDatabaseName() {
        return databaseName;
    }

    @Override
    @Bean
    public MongoClient mongoClient() {
        try {
            // ── Create a trust-all SSLContext ─────────────────
            // Bypasses Windows SSPI certificate chain validation
            // that causes 'internal_error' TLS alerts from Atlas
            TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                    public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                    public void checkServerTrusted(X509Certificate[] certs, String authType) {}
                }
            };

            SSLContext sslContext = SSLContext.getInstance("TLSv1.2");
            sslContext.init(null, trustAllCerts, new java.security.SecureRandom());

            // ── Build MongoClientSettings with custom SSL ──────
            MongoClientSettings settings = MongoClientSettings.builder()
                    .applyConnectionString(new ConnectionString(mongoUri))
                    .applyToSslSettings(ssl -> {
                        ssl.enabled(true);
                        ssl.invalidHostNameAllowed(true);
                        ssl.context(sslContext);
                    })
                    .build();

            return MongoClients.create(settings);

        } catch (Exception e) {
            throw new RuntimeException("Failed to create MongoDB client: " + e.getMessage(), e);
        }
    }
}
