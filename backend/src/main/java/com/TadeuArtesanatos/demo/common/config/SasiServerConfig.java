package com.TadeuArtesanatos.demo.common.config;

import org.apache.catalina.connector.Connector;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Profile "sasi" (trabalho da faculdade): além do conector HTTPS principal (porta
 * server.port=8443, com o certificado OpenSSL), sobe um conector HTTP puro na
 * porta app.http-port=8080. Assim o mesmo app serve:
 *   - http://localhost:8080  -> páginas públicas (social, catálogo, política)
 *   - https://localhost:8443 -> páginas sensíveis (login, checkout, conta...)
 * O Spring Security (requiresChannel) força HTTPS só onde é necessário.
 */
@Configuration
@Profile("sasi")
public class SasiServerConfig {

    @Value("${app.http-port:8080}")
    private int httpPort;

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> httpConnector() {
        return factory -> {
            Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
            connector.setScheme("http");
            connector.setSecure(false);
            connector.setPort(httpPort);
            factory.addAdditionalConnectors(connector);
        };
    }
}
