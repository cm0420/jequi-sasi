package com.TadeuArtesanatos.demo.security.config;

import com.TadeuArtesanatos.demo.security.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.authorization.AuthorityAuthorizationManager;
import org.springframework.security.authorization.SingleResultAuthorizationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins}")
    private String[] corsAllowedOrigins;

    @Value("${app.payment.fake-open-simulation:false}")
    private boolean fakePaymentOpenSimulation;

    // profile sasi: força HTTPS só nas rotas sensíveis (login, checkout, conta, APIs de dados).
    @Value("${app.require-ssl-on-sensitive:false}")
    private boolean requireSslOnSensitive;

    @Value("${app.http-port:8080}")
    private int httpPort;

    @Value("${server.port:8443}")
    private int httpsPort;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // stateless + JWT: CSRF clássico não se aplica ao header Bearer
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Sem token em rota protegida = 401 (o padrão era 403); o front usa o 401 para tentar o refresh.
                .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .authorizeHttpRequests(auth -> auth
                        // SPA Angular servida pelo backend (profile sasi): shell e assets são públicos.
                        // Os dados de verdade continuam protegidos nas rotas /api abaixo.
                        .requestMatchers(HttpMethod.GET,
                                "/", "/index.html", "/favicon.ico", "/favicon-jequi.ico", "/apple-touch-icon.png",
                                "/*.js", "/*.css", "/*.png", "/*.webp", "/*.svg", "/*.ico", "/*.woff2", "/*.txt",
                                "/assets/**", "/media/**", "/logo-jequi.png",
                                "/catalogo", "/pecas/**", "/conjuntos/**", "/login", "/signup",
                                "/carrinho", "/checkout", "/checkout/**", "/pedidos", "/pedidos/**",
                                "/cliente", "/cliente/**", "/admin", "/admin/**", "/politica-de-seguranca"
                        ).permitAll()
                        // públicos
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers("/error").permitAll()

                        // user — regras fixas por role (ver módulo user)
                        .requestMatchers(HttpMethod.GET, "/api/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/users/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/users/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/users/*/role").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/users/*").hasRole("ADMIN")
                        // /api/users/*/senha fica de fora — regra condicional, resolvida via @PreAuthorize no controller

                        // customer — rotas /me autenticadas, rota admin fixa (ver módulo customer)
                        .requestMatchers("/api/customers/me/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/customers/*").hasRole("ADMIN")

                        // catalog — navegação pública, CRUD só ADMIN (ver módulo catalog)
                        .requestMatchers(HttpMethod.GET, "/api/catalog/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/catalog/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/catalog/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/catalog/**").hasRole("ADMIN")

                        // stock — endpoints de teste manual, ADMIN só por enquanto (fluxo real vem com order)
                        .requestMatchers("/api/stock/**").hasRole("ADMIN")

                        // order — rotas /me autenticadas, rotas admin fixas
                        .requestMatchers("/api/orders/me/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/orders").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/orders/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/orders/*/mark-paid").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/orders/*/ship").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/orders/*/deliver").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/orders/*/cancel").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/orders/*/refund-approve").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/orders/*/refund-deny").hasRole("ADMIN")

                        // payment — webhook fake: público só em dev; fora de dev é o ADMIN confirmando o pagamento.
                        // Demais webhooks (gateways reais) públicos; resto exige autenticação.
                        .requestMatchers("/api/payments/webhook/fake").access(fakePaymentOpenSimulation
                                ? SingleResultAuthorizationManager.permitAll()
                                : AuthorityAuthorizationManager.hasRole("ADMIN"))
                        .requestMatchers("/api/payments/webhook/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/payments/*").hasRole("ADMIN")

                        // admin — tudo ADMIN, sem exceção
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider(passwordEncoder()))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        // profile sasi: HTTPS obrigatório nas rotas sensíveis; o resto (social, catálogo,
        // assets) fica disponível em HTTP e HTTPS. Não é "global" — só onde tem dado sensível.
        if (requireSslOnSensitive) {
            http.requiresChannel(channel -> channel
                            .requestMatchers(
                                    "/auth/**", "/api/customers/**", "/api/orders/**", "/api/payments/**",
                                    "/login", "/signup", "/carrinho", "/checkout", "/checkout/**",
                                    "/cliente", "/cliente/**", "/pedidos", "/pedidos/**", "/admin", "/admin/**"
                            ).requiresSecure())
                    .portMapper(mapper -> mapper.http(httpPort).mapsTo(httpsPort));
        }

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(corsAllowedOrigins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setAllowCredentials(true); // obrigatório para o cookie HttpOnly do refresh token trafegar

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
