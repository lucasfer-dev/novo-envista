package com.envista.platform.teams;
import org.springframework.http.ResponseEntity; import org.springframework.web.bind.annotation.*; import java.util.UUID;
@RestController @RequestMapping("/api/teams")
public class TeamController {
 @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable UUID id){ return ResponseEntity.noContent().build(); }
}
