package com.envista.platform.admin;
import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*; import java.util.Map;
@RestController @RequestMapping("/api/admin") @PreAuthorize("hasRole('ADMIN')")
public class AdminController {
 @GetMapping("/dashboard") public Map<String,Object> dashboard(){ return Map.of("users",1284,"projects",96,"teams",41,"openReports",7); }
 @PostMapping("/courses") public Map<String,String> publishCourse(){ return Map.of("status","course-publish-endpoint-ready"); }
}
