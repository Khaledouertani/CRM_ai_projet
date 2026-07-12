using CrmApi.Models.Entities;
using CrmApi.Data;
using CrmApi.DTOs.Auth;
using CrmApi.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Auth;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;

    public AuthService(ApplicationDbContext context, IUnitOfWork uow)
    {
        _context = context;
        _uow = uow;
    }

    public async Task<LoginResponseDto?> LoginAsync(string email, string password)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return null;
        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash)) return null;
        return new LoginResponseDto
        {
            UserId = user.Id,
            Email = user.Email,
            Name = user.Name,
            Role = user.Role
        };
    }

    public async Task<bool> RegisterAsync(RegisterDto dto)
    {
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (existingUser != null) return false;
        var user = new Models.Entities.User
        {
            Email = dto.Email,
            Name = dto.Name,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role ?? "Agent"
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return true;
    }
}
