package com.TadeuArtesanatos.demo.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Profile "sasi": serve a SPA Angular (build copiado para resources/static) e faz o
 * fallback de rotas client-side para o index.html. Chamadas de API/auth continuam
 * indo para os @RestController (não recebem o index).
 */
@Configuration
@Profile("sasi")
public class SpaResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requested = location.createRelative(resourcePath);
                        if (requested.exists() && requested.isReadable()) {
                            return requested;
                        }
                        // deixa a requisição seguir para os controllers de back-end
                        if (resourcePath.startsWith("api/") || resourcePath.startsWith("auth/")
                                || resourcePath.startsWith("actuator/") || resourcePath.startsWith("swagger")
                                || resourcePath.startsWith("v3/") || resourcePath.startsWith("error")) {
                            return null;
                        }
                        // rota de SPA: entrega o index.html (o Angular Router assume)
                        return new ClassPathResource("static/index.html");
                    }
                });
    }
}
