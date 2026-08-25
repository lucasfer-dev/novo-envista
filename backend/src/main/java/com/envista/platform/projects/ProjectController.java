package com.envista.platform.projects;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI; import java.util.Map; import java.util.UUID;
@RestController @RequestMapping("/api/projects")
public class ProjectController {
 @PostMapping public ResponseEntity<?> create(@Valid @RequestBody CreateProjectRequest request){ return ResponseEntity.created(URI.create("/api/projects/"+UUID.randomUUID())).body(Map.of("status","ready-for-service-layer")); }
 @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable UUID id){ return ResponseEntity.noContent().build(); }
 @PostMapping("/{id}/like") public Map<String,Object> like(@PathVariable UUID id){ return Map.of("projectId",id,"liked",true); }
 @PostMapping("/{id}/follow") public Map<String,Object> follow(@PathVariable UUID id){ return Map.of("projectId",id,"following",true); }
 public record CreateProjectRequest(@NotBlank String title, String shortDescription, @NotBlank String authorType, UUID authorId){}
}
