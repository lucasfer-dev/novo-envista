package com.envista.platform.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
@Configuration @EnableMethodSecurity
public class SecurityConfig {
 @Bean SecurityFilterChain security(HttpSecurity http) throws Exception {
  return http.csrf(csrf->csrf.disable())
   .authorizeHttpRequests(auth->auth
    .requestMatchers("/actuator/health","/api/public/**").permitAll()
    .requestMatchers(HttpMethod.GET,"/api/projects/public/**","/api/social/public/**").permitAll()
    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    .anyRequest().authenticated())
   .oauth2ResourceServer(oauth->oauth.jwt(jwt->{})).build();
 }
}
