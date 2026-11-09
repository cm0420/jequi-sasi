package com.TadeuArtesanatos.demo.common.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Profile "sasi" — HTTPS seletivo.
 *
 * Substitui o requiresChannel do Spring Security (removido na versão 7): quando uma rota
 * sensível (login, cadastro, checkout, conta, pedidos, admin e as APIs de dados) chega pelo
 * conector HTTP (8080), devolve 302 para o conector HTTPS (8443). As rotas públicas (social,
 * catálogo, assets) seguem acessíveis nos dois protocolos — HTTPS não é global.
 */
@Component
@Profile("sasi")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SasiChannelRedirectFilter extends OncePerRequestFilter {

    @Value("${server.port:8443}")
    private int httpsPort;

    // Prefixos sensíveis. Entradas terminadas em "/" casam por prefixo; as demais casam
    // o caminho exato ou um subcaminho (ex.: "/checkout" e "/checkout/123").
    private static final List<String> SENSITIVE = List.of(
            "/auth/", "/api/customers/", "/api/orders/", "/api/payments/",
            "/login", "/signup", "/carrinho", "/checkout",
            "/cliente", "/pedidos", "/admin"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!request.isSecure() && isSensitive(request.getRequestURI())) {
            String query = request.getQueryString();
            String target = "https://" + request.getServerName() + ":" + httpsPort
                    + request.getRequestURI() + (query != null ? "?" + query : "");
            response.setStatus(HttpServletResponse.SC_FOUND);
            response.setHeader("Location", target);
            return;
        }
        chain.doFilter(request, response);
    }

    private boolean isSensitive(String uri) {
        for (String prefix : SENSITIVE) {
            if (prefix.endsWith("/")) {
                if (uri.startsWith(prefix)) {
                    return true;
                }
            } else if (uri.equals(prefix) || uri.startsWith(prefix + "/")) {
                return true;
            }
        }
        return false;
    }
}
