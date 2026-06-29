using System.Security.Claims;

namespace CrmApi.Helpers;

public static class UserContextHelper
{
    public static int GetUserId(ClaimsPrincipal user) => int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value ?? "0");
    public static string GetUsername(ClaimsPrincipal user) => user.FindFirst(ClaimTypes.Name)?.Value ?? user.FindFirst("unique_name")?.Value ?? "";
    public static string GetRole(ClaimsPrincipal user) => user.FindFirst("role")?.Value ?? user.FindFirst(ClaimTypes.Role)?.Value ?? "";
    public static bool IsAdmin(ClaimsPrincipal user) => GetRole(user) == "admin";
    public static bool IsAdminOrQualite(ClaimsPrincipal user) { var r = GetRole(user); return r == "admin" || r == "qualite"; }
    public static bool IsAgent(ClaimsPrincipal user) => GetRole(user) == "agent";
}
